<?php

namespace Claroline\AnalyticsBundle\Installation;

use Claroline\AnalyticsBundle\Installation\Updater\Updater130300;
use Claroline\InstallationBundle\Additional\AdditionalInstaller;

class ClarolineAnalyticsInstaller extends AdditionalInstaller
{
    public static function getUpdaters(): array
    {
        return [
            '13.1.1' => Updater130300::class,
        ];
    }

    public function hasMigrations(): bool
    {
        return false;
    }
}
