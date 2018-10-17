//@flow
import * as React from 'react'
import { Component } from 'react'
import { Portal } from '../../src'
import type { Actions } from '../../src'


type Props = {
  id: string,
  title?: React.Node,
  left?: number,
  top?: number,
  width?: number,
  height?: number,
  backgroundColor?: string,
  actions?: (?Actions) => mixed,
}

export default class PortalLayer extends Component<Props> {
  static defaultProps = {
    id: 'portal',
    title: 'Portal',
    left: 100,
    top: 100,
    width: 600,
    height: 300,
    backgroundColor: 'rgba(50, 150, 150, .3',
  }

  actions: ?Actions

  componentDidMount() {
    if (typeof this.props.actions === 'function') {
      this.props.actions(this.actions)
    }
  }

  render() {
    const { id, title, left, top, width, height, backgroundColor } = this.props
    return (
      <Portal
        id={id}
        bringToFront={true}
        actions={actions => this.actions = actions}
      >
        <div style={{
          position: 'absolute',
          top, left, width, height,
          backgroundColor,
          border: '2px solid red',
          boxShadow: '4px 4px 20px gray',
          padding: '10px 20px',
        }}
        >
          <h1>
            {title}
          </h1>
          <hr />
          <button onClick={() => this.actions && this.actions.hide()}>Hide</button>
        </div>
      </Portal>
    )
  }
}
