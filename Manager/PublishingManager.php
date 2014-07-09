<?php

namespace Innova\PathBundle\Manager;

use Doctrine\Common\Persistence\ObjectManager;

use Innova\PathBundle\Entity\InheritedResource;
use Innova\PathBundle\Entity\Path\Path;
use Innova\PathBundle\Entity\Step;

/**
 * Manage Publishing of the paths
 */
class PublishingManager
{
    /**
     * Current entity manage for data persist
     * @var \Doctrine\Common\Persistence\ObjectManager $om
     */
    protected $om;

    /**
     * Resource Manager
     * @var \Claroline\CoreBundle\Manager\ResourceManager
     */
    protected $resourceManager;

    /**
     * innova step manager
     * @var \Innova\PathBundle\Manager\StepManager
     */
    protected $stepManager;
    
    /**
     * Current workspace of the path
     * @var \Claroline\CoreBundle\Entity\Workspace\Workspace
     */
    protected $workspace;
    
    /**
     * Path to publish
     * @var \Innova\PathBundle\Entity\Path\Path
     */
    protected $path;
    
    /**
     * JSON structure of the path
     * @var \stdClass
     */
    protected $pathStructure;
    
    /**
     * List of all resources linked to the current path
     * @var array
     */
    protected $pathResources = array ();
    
    /**
     * Class constructor
     * @param \Doctrine\Common\Persistence\ObjectManager $objectManager
     * @param \Innova\PathBundle\Manager\StepManager     $stepManager
     */
    public function __construct(
        ObjectManager $objectManager,
        StepManager   $stepManager)
    {
        $this->om          = $objectManager;
        $this->stepManager = $stepManager;
    }

    /**
     * Initialize a new Publishing
     * @param \Innova\PathBundle\Entity\Path\Path $path
     * @throws \Exception
     * @return \Innova\PathBundle\Manager\PublishingManager
     */
    protected function start(Path $path)
    {
        // Get the path structure
        $pathStructure = $path->getStructure();
        if (empty($pathStructure)) {
            throw new \Exception('Unable to find JSON structure of the path. Publication aborted.');
        }
        
        // Decode structure
        $this->pathStructure = json_decode($pathStructure);
        
        $this->path = $path;
        $this->workspace = $path->getResourceNode()->getWorkspace();
        
        return $this;
    }
    
    /**
     * End of the Publishing
     * Remove temp data from current service
     * @return \Innova\PathBundle\Manager\PublishingManager
     */
    protected function end()
    {
        $this->workspace     = null;
        $this->path          = null;
        $this->pathStructure = null;
        $this->pathResources = array ();
        
        return $this;
    }
    
    /**
     * Publish path
     * Create all needed Entities from JSON structure created by the Editor
     * @param  \Innova\PathBundle\Entity\Path\Path $path
     * @throws \Exception
     * @return \Innova\PathBundle\Manager\PublishingManager
     */
    public function publish(Path $path)
    {
        // Start Publishing
        $this->start($path);
    
        // Store existing steps to remove steps which no longer exist
        $existingSteps = $path->getSteps();
        $existingSteps = $existingSteps->toArray();
        
        // Publish steps for this path
        $toProcess = !empty($this->pathStructure->steps) ? $this->pathStructure->steps : array ();
        $publishedSteps = $this->publishSteps(0, null, $toProcess);
        
        // Clean steps to remove
        $this->cleanSteps($publishedSteps, $existingSteps);
    
        // Re encode updated structure and update Path
        $this->path->setStructure(json_encode($this->pathStructure));
    
        // Mark Path as published
        $this->path->setPublished(true);
        $this->path->setModified(false);
    
        // Persist data
        $this->om->persist($this->path);
        $this->om->flush();
        
        // End Publishing
        $this->end();
        
        return $this;
    }
    
    /**
     * Publish steps for the path
     * @param  integer                        $level
     * @param  \Innova\PathBundle\Entity\Step $parent
     * @param  array                          $steps
     * @param  array                          $propagatedResources
     * @return array
     */
    protected function publishSteps($level = 0, Step $parent = null, array $steps = array (), $propagatedResources = array ())
    {
        $currentOrder = 0;
        $processedSteps = array();
        
        // Retrieve existing steps for this path
        $existingSteps = $this->path->getSteps();
        foreach ($steps as $stepStructure) {
            if (empty($stepStructure->resourceId) || !$existingSteps->containsKey($stepStructure->resourceId)) {
                // Current step has never been published or step entity has been deleted => create it
                $step = $this->stepManager->create($this->path, $level, $parent, $currentOrder, $stepStructure);
    
                // Update json structure with new resource ID
                $stepStructure->resourceId = $step->getId();
            }
            else {
                // Step already exists => update it
                $step = $existingSteps->get($stepStructure->resourceId);
                $step = $this->stepManager->edit($this->path, $level, $parent, $currentOrder, $stepStructure, $step);
            }

            // Manage resources inheritance
            $excludedResources = !empty($stepStructure->excludedResources) ? $stepStructure->excludedResources : array ();
            $this->publishPropagatedResources($step, $propagatedResources, $excludedResources);

            // Store step to know it doesn't have to be deleted when we will clean the path
            $processedSteps[$step->getId()] = $step;
    
            // Process children of current step
            if (!empty($stepStructure->children)) {
                // Add propagated resources of current step for children
                $currentPropagatedResources = array ();
                if (!empty($stepStructure->resources)) {
                    foreach ($stepStructure->resources as $resource) {
                        if ($resource->propagateToChildren) {
                            // Resource is propagated
                            $currentPropagatedResources[] = array (
                                'id'         => $resource->id,
                                'resourceId' => $resource->resourceId,
                                'lvl'        => $level,
                            );
                        }
                    }
                }

                $childrenLevel = $level + 1;
                $childrenSteps = $this->publishSteps($childrenLevel, $step, $stepStructure->children, $propagatedResources + $currentPropagatedResources);
    
                // Store children steps
                $processedSteps = $processedSteps + $childrenSteps;
            }
    
            $currentOrder++;
        }
    
        return $processedSteps;
    }

    protected function publishPropagatedResources(Step $step, array $propagatedResources = array (), array $excludedResources = array ())
    {
        $inheritedResources = array ();
        $currentInherited = $step->getInheritedResources();

        if (!empty($propagatedResources)) {
            foreach ($propagatedResources as $resource) {
                if (!in_array($resource['id'], $excludedResources)) {
                    // Resource is not excluded => link it to step

                    // Retrieve resource node
                    $resourceNode = $this->om->getRepository('ClarolineCoreBundle:Resource\ResourceNode')->findOneById($resource['resourceId']);

                    if (!$inherited = $step->hasInheritedResource($resourceNode->getId())) {
                        // Inherited resource doesn't exist => Create inherited resource
                        $inherited = new InheritedResource();
                    }

                    // Update inherited resource properties
                    $inherited->setResource($resourceNode);
                    $inherited->setLvl($resource['lvl']);

                    // Add inherited resource to Step
                    $step->addInheritedResource($inherited);

                    $this->om->persist($inherited);

                    // Store resource ID to clean step
                    $inheritedResources[] = $resourceNode->getId();
                }
            }
        }

        // Clean inherited resources which no long exists
        foreach ($currentInherited as $inherited) {
            $resourceId = $inherited->getResource()->getId();
            if (!in_array($resourceId, $inheritedResources)) {
                $step->removeInheritedResource($inherited);
                $this->om->remove($inherited);
            }
        }

        return $this;
    }

    /**
     * Clean steps which no long exist in the current path
     * @param  array $neededSteps
     * @param  array $existingSteps
     * @return \Innova\PathBundle\Manager\PublishingManager
     */
    protected function cleanSteps(array $neededSteps = array (), array $existingSteps = array ())
    {
        $toRemove = array_diff_key($existingSteps, $neededSteps);
        foreach ($toRemove as $stepToRemove) {
            $this->path->removeStep($stepToRemove);
            $this->om->remove($stepToRemove);
        }
        
        return $this;
    }
}