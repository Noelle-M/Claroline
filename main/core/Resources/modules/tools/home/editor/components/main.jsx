import React from 'react'
import {PropTypes as T} from 'prop-types'

import {Routes} from '#/main/app/router'

import {WidgetContainer as WidgetContainerTypes} from '#/main/core/widget/prop-types'
import {Tab as TabTypes} from '#/main/core/tools/home/prop-types'

import {EditorTab} from '#/main/core/tools/home/editor/components/tab'

const EditorMain = props =>
  <Routes
    path={props.path}
    redirect={[
      props.tabs[0] && {from: '/edit/tab', exact: true, to: '/edit/tab/'+props.tabs[0].id }
    ].filter(redirect => !!redirect)}
    routes={[
      {
        path: '/edit/tab/:id',
        onEnter: (params = {}) => props.setCurrentTab(params.id),
        render: (routeProps) => {
          if (props.tabs.find(tab => tab.id === routeProps.match.params.id)) {
            const Editor = (
              <EditorTab
                {...props}
              />
            )

            return Editor
          }

          // tab does not exist
          // let's redirection open the first available
          routeProps.history.replace(props.path)

          return null
        }
      }
    ]}
  />

EditorMain.propTypes = {
  path: T.string.isRequired,
  currentUser: T.object,
  setCurrentTab: T.func.isRequired,
  currentContext: T.object.isRequired,
  administration: T.bool.isRequired,
  readOnly: T.bool.isRequired,
  tabs: T.arrayOf(T.shape(
    TabTypes.propTypes
  )),
  currentTabTitle: T.string,
  currentTab: T.shape(TabTypes.propTypes),
  currentTabIndex: T.number.isRequired,
  widgets: T.arrayOf(T.shape(
    WidgetContainerTypes.propTypes
  )).isRequired,
  history: T.shape({
    push: T.func.isRequired
  }).isRequired,
  createTab: T.func.isRequired,
  updateTab: T.func.isRequired,
  setErrors: T.func.isRequired,
  deleteTab: T.func.isRequired,
  moveTab: T.func.isRequired
}

export {
  EditorMain
}
