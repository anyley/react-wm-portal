//@flow
import React, { Component } from 'react'
import { render } from 'react-dom'
import PortalLayer from './PortalLayer'
import type { Actions } from '../../src'


type PortalState = {
  state: boolean
}

type State = {
  portals: Array<PortalState>
}


class Demo extends Component<any, State> {
  state = {
    portals: [
      { state: true },
      { state: true },
    ],
  }

  actions1: ?Actions
  actions2: ?Actions

  nextPortalState = (n) => `${this.state.portals[n].state ? 'Hide' : 'Show'} portal ${n + 1}`

  toggle = (actions: ?Actions) => {
    actions && actions.toggle()
  }

  render() {
    return <div>
      <h1>react-wm-portal Demo</h1>

      <button onClick={() => this.toggle(this.actions1)}>
        {this.nextPortalState(0)}
      </button>

      <button onClick={() => this.toggle(this.actions2)}>
        {this.nextPortalState(1)}
      </button>

      <PortalLayer
        id="portal-1"
        title="Portal 1"
        top={150}
        actions={actions => this.actions1 = actions}
      />

      <PortalLayer
        id="portal-2"
        title="Portal 2"
        left={300}
        top={300}
        actions={actions => this.actions2 = actions}
      />
    </div>
  }
}

const el = document.querySelector('#demo')

el && render(<Demo />, el)
