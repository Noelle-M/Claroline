import React from 'react'
import {PropTypes as T} from 'prop-types'

import {schemeCategory20c} from 'd3-scale'

import {trans, fileSize} from '#/main/app/intl'
import {ContentCounter} from '#/main/app/content/components/counter'
import {ToolPage} from '#/main/core/tool/containers/page'

import {ResourcesChart} from '#/plugin/analytics/charts/resources/containers/chart'
import {TopResourcesChart} from '#/plugin/analytics/charts/top-resources/containers/chart'

const ContentTab = (props) =>
  <ToolPage
    subtitle={trans('content')}
  >
    <div className="row">
      <ContentCounter
        icon="fa fa-book"
        label={trans('workspaces')}
        color={schemeCategory20c[1]}
        value={props.count.workspaces}
      />

      <ContentCounter
        icon="fa fa-folder"
        label={trans('resources')}
        color={schemeCategory20c[5]}
        value={props.count.resources}
      />

      <ContentCounter
        icon="fa fa-server"
        label={trans('storage_used')}
        color={schemeCategory20c[9]}
        value={fileSize(props.count.storage)+trans('bytes_short')}
      />
    </div>

    <div className="row">
      <div className="col-md-4">
        <ResourcesChart url={['apiv2_admin_tool_analytics_resources']} />
      </div>

      <div className="col-md-8">
        <TopResourcesChart url={['apiv2_admin_tool_analytics_top_resources']} />
      </div>
    </div>
  </ToolPage>

ContentTab.propTypes = {
  count: T.shape({
    workspaces: T.number,
    resources: T.number,
    storage: T.number
  })
}

export {
  ContentTab
}
