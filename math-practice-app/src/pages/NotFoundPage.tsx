import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

function NotFoundPage() {
  return (
    <PageContainer
      title="Oops! Page not found"
      subtitle="We couldn't find that page. Let's get you back to practicing."
      width="narrow"
    >
      <div className="page__actions">
        <Link to="/" className="btn btn--primary">
          Back to Home
        </Link>
      </div>
    </PageContainer>
  )
}

export default NotFoundPage
