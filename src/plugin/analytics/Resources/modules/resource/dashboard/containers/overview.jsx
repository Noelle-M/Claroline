import {connect} from 'react-redux'

import {selectors as resourceSelectors} from '#/main/core/resource/store'

import {DashboardOverview as DashboardOverviewComponent} from '#/plugin/analytics/resource/dashboard/components/overview'

const DashboardOverview = connect(
  state => ({
    resourceNode: resourceSelectors.resourceNode(state)
  })
)(DashboardOverviewComponent)

export {
  DashboardOverview
}