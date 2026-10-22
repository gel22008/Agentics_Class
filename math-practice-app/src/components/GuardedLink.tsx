import { useContext, type ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import { NavigationGuardContext } from '../hooks/navigationGuard'

/** A Link that first asks the current page (e.g. an active practice session) if it may leave. */
function GuardedLink({ to, onClick, ...props }: ComponentProps<typeof Link> & { to: string }) {
  const guardRef = useContext(NavigationGuardContext)
  return (
    <Link
      to={to}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented && guardRef?.current?.(to)) event.preventDefault()
      }}
      {...props}
    />
  )
}

export default GuardedLink
