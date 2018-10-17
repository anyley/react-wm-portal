/* eslint-disable no-use-before-define */
//@flow
import * as React from 'react'
import ReactDOM from 'react-dom'
import { ReactWM, findHighestZIndex, nextConst } from './helpers'


const EmptyChildren = () => <div />
const StringChildren = props => <div>{props.children}</div>

type PortalChildren =
  | React.Element<any>
  | Iterable<?React.Node>

export type Portals = { ...PortalRecord }

export type PortalType = {
  id: string,
  el?: ?HTMLElement,
  status: number,
  visibility: number,
  props?: {
    onClose?: (params: mixed, props: any, portals: Portals) => boolean,
    bringToFront?: () => void
  },
  children?: React.ChildrenArray<any>,
}

type PortalRecord = {| [string]: PortalType |}
export type PortalId = string | PortalType
type PortalPair = {| id: string, portal: PortalType |}

export type Actions = {
  show: () => boolean,
  hide: () => boolean,
  toggle: () => boolean,
  close: (params: Object, confirm: boolean) => any,
  bringToFront: () => mixed,
}

type Props = {|
  id: string,
  actions?: (Actions) => mixed,
  bringToFront?: boolean,
  show?: boolean,
  children?: PortalChildren,
|}

export type PortalState = {|
  status: number,
  visibility: number
|}

const ID_REQIORED = 'Portal id required!'

export const UNMOUNTED = nextConst('UNMOUNTED', 'portal_lifecycle')
export const UNMOUNTING = nextConst('UNMOUNTING', 'portal_lifecycle')
export const CREATING = nextConst('CREATING', 'portal_lifecycle')
export const CREATED = nextConst('CREATED', 'portal_lifecycle')
export const CREATE_ERROR = nextConst('CREATE_ERROR', 'portal_lifecycle')
export const MOUNTING = nextConst('MOUNTING', 'portal_lifecycle')
export const MOUNT_ERROR = nextConst('MOUNT_ERROR', 'portal_lifecycle')
export const MOUNTED = nextConst('MOUNTED', 'portal_lifecycle')

export const HIDDEN = nextConst('HIDDEN', 'portal_vision')
export const VISIBLE = nextConst('VISIBLE', 'portal_vision')

export const portals: Portals = {}
ReactWM.portals = portals


export class Portal extends React.Component<Props> {
  static getPortal = (params: PortalId): ?PortalType => {
    const id = Portal.getId(params)
    return id in portals ? portals[id] : undefined
  }

  static getId = (params: PortalId): string => typeof params === 'string' ? params : params.id

  static create = ({ id, children, component, props, autoMount }: {
    id: string,
    children?: React.Node,
    component?: React.Node,
    props?: any,
    autoMount: boolean
  }): ?PortalType => {
    children = children || component
    let portal = Portal.getPortal(id)

    if (portal && portal.status !== UNMOUNTED) return undefined

    if (!document.querySelector(`#${id}`)) {
      portals[id] = {
        id,
        status: CREATING,
        props,
        visibility: VISIBLE
      }

      const el: ?HTMLElement = document.createElement('div')

      if (el && document.body) {
        el.id = id
        el.style.position = 'absolute'
        el.style.left = '0'
        el.style.top = '0'
        el.style.width = '0'
        el.style.height = '0'

        if (props && props.show === false) {
          el.style.display = 'none'
          el.style.visibility = 'hidden'
          portals[id].visibility = HIDDEN
        }

        document.body.appendChild(el)

        if (typeof children === 'string') {
          children = <StringChildren>{children}</StringChildren>
        } else if (!children) {
          children = <EmptyChildren />
        } else if (typeof children === 'function') {
          children = <StringChildren>{children(props)}</StringChildren>
        }

        portal = Object.assign(portals[id], {
          id,
          el,
          status: CREATED,
          children,
          props,
        })

        if (autoMount) {
          Portal.mount(id)
        }

        return portal
      } else {
        Object.assign(portals[id], { status: CREATE_ERROR })
      }
    }
  }

  static parseParams = (params: PortalId): ?PortalPair => {
    if (!params) return null

    if (typeof params === 'string') {
      const portal = Portal.getPortal(params)
      if (!portal) throw new Error(`Portal with id '${Portal.getId(params)}' not found.`)
      return { id: params, portal }
    }

    return { id: params.id, portal: params }
  }

  static mount = (params: PortalId) => {
    const idPair = Portal.parseParams(params)

    if (!idPair) throw new Error(ID_REQIORED)

    const { id, portal } = idPair
    const { el, children } = portal

    if (!el || !children || portal.status === MOUNTING) return

    const getPropsByType = (child): any => {
      const props = {}
      if (child !== null && typeof child.type !== 'string') {
        props.portal = Portal.getActions(id)
      }
      return props
    }

    portal.status = MOUNTING

    const childrenArray: any = React.Children.map(
      React.Children.toArray(children),
      (child) => React.cloneElement(child, getPropsByType(child)),
    )

    ReactDOM.render(childrenArray, el)

    portal.status = MOUNTED

    if (portal.props && portal.props.bringToFront) {
      Portal.bringToFront(id)
    }
  }

  static unmount = async (params: PortalId, userParams: any, confirm: boolean = true) => {
    const pairId = Portal.parseParams(params)
    if (!pairId) throw new Error(ID_REQIORED)

    const { id, portal } = pairId
    const currentStatus = portal.status

    if (portal.status === UNMOUNTED || portal.status === UNMOUNTING) return

    portal.status = UNMOUNTING

    let submitClose = true

    if (portal.props && confirm) {
      const { onClose } = portal.props
      submitClose = await (!onClose || (onClose && onClose(userParams, portal.props, portals)))
    }

    if (submitClose && portal.el && document.body) {
      document.body.removeChild(portal.el)
      Object.assign(portal, {
        id,
        status: UNMOUNTED,
        el: null,
        children: null,
        props: {},
      })
    } else {
      portal.status = currentStatus
    }

    return portal
  }

  static remove = async (params: PortalId, confirm: boolean = false) => {
    const pairId = Portal.parseParams(params)
    if (!pairId) throw new Error(ID_REQIORED)

    const { id, portal } = pairId

    if (portal) {
      await Portal.unmount(id, null, confirm)
    }

    if (id in portals && portal.status === UNMOUNTED) {
      delete portals[id]
    }
  }

  static bringToFront = (params: PortalId) => {
    const pairId = Portal.parseParams(params)
    if (!pairId) throw new Error(ID_REQIORED)

    const { portal } = pairId

    if (portal && portal.status === MOUNTED) {
      const { el } = portal

      if (el) {
        const highestZIndex = findHighestZIndex()
        el.style.zIndex = String(highestZIndex + 1)
      }
    }
  }

  static toggle = (params: PortalId): boolean => {
    const pairId = Portal.parseParams(params)
    if (!pairId) throw new Error(ID_REQIORED)

    const { portal } = pairId

    if (portal) {
      if (portal.visibility === HIDDEN) {
        Portal.setVisible(portal)
      } else {
        Portal.setHidden(portal)
      }
    }
    return false
  }

  static setVisible = (portal: PortalType): boolean => {
    if (portal.el) {
      portal.el.style.display = 'block'
      portal.el.style.visibility = 'visible'
      portal.visibility = VISIBLE
      return true
    }
    return false
  }

  static setHidden = (portal: PortalType): boolean => {
    if (portal.el) {
      portal.el.style.display = 'none'
      portal.el.style.visibility = 'hidden'
      portal.visibility = HIDDEN
      return true
    }
    return false
  }

  static show = (params: PortalId): boolean => {
    const pairId = Portal.parseParams(params)
    if (!pairId) throw new Error(ID_REQIORED)

    const { portal } = pairId

    return portal && Portal.setVisible(portal)
  }

  static hide = (params: PortalId): boolean => {
    const pairId = Portal.parseParams(params)
    if (!pairId) throw new Error(ID_REQIORED)

    const { portal } = pairId

    return portal && Portal.setHidden(portal)
  }

  static getState = (params: PortalId): PortalState | void => {
    const pairId = Portal.parseParams(params)
    if (!pairId) throw new Error(ID_REQIORED)

    const { portal } = pairId

    return portal ? ({
      status: portal.status,
      visibility: portal.visibility,
    }) : undefined
  }

  static getActions = (id: PortalId): Actions => ({
    show: () => Portal.show(id),
    hide: () => Portal.hide(id),
    toggle: () => Portal.toggle(id),
    getState: () => Portal.getState(id),
    close: (params: any, confirm: boolean) => Portal.unmount(id, params, confirm),
    bringToFront: () => Portal.bringToFront(id),
  })

  constructor(props: Props) {
    super(props)
    const { id, children, ...otherProps } = props
    const { actions } = props

    if (typeof actions === 'function') {
      actions(Portal.getActions(id))
    }

    Portal.create({ id, children, props: otherProps, autoMount: false })
  }

  componentDidMount() {
    const { id } = this.props
    const portal = Portal.getPortal(id)

    if (portal && portal.status === CREATED) {
      Portal.mount(id)

      if (portal.props && portal.props.bringToFront) {
        Portal.bringToFront(id)
      }
    }
  }

  render() {
    return null
  }
}

export default Portal
