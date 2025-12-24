import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import List from './pages/Opportunities/List'
import Board from './pages/Opportunities/Board'
import Timeline from './pages/Opportunities/Timeline'
import PostSubmission from './pages/Opportunities/PostSubmission'
import TrackerWizard from './pages/Import/TrackerWizard'
import AttachmentsPage from './pages/Opportunities/Attachments'
import ComplianceMatrix from './pages/Compliance/Matrix'
import ClarificationsPage from './pages/Clarifications/Index'
import PricingPage from './pages/Pricing/Index'
import ApprovalsPage from './pages/Approvals/Index'
import SubmissionPage from './pages/Submission/Index'
import OutcomePage from './pages/Outcome/Index'
import AwardsStagingPage from './pages/Awards/Staging'
import AwardsEventsPage from './pages/Awards/Events'
import AvailableTendersPage from './pages/Tenders/Available'
import UsersPage from './pages/Admin/Users'
import BusinessRolesPage from './pages/Admin/BusinessRoles'
import ApprovalReviewPage from './pages/Approvals/Review'
import Callback from './pages/Auth/Callback'
import DevLogin from './pages/Auth/DevLogin'
import Layout from './components/Layout'
import OpportunityOverview from './pages/Opportunities/Overview'
import AttachmentSearchPage from './pages/Search/Attachments'
import SlaSettingsPage from './pages/Settings/Sla'
import NotificationsPage from './pages/Notifications/Index'
import ErrorPage from './components/ErrorPage'
import { getToken } from './utils/auth'

function RequireAuth() {
	const token = typeof window !== 'undefined' ? getToken() : null
	if (!token) {
		return <Navigate to="/auth/dev" replace />
	}
	return <Outlet />
}

const router = createBrowserRouter([
	{
		element: <RequireAuth />,
		errorElement: <ErrorPage />,
		children: [
			{
				element: <Layout />,
				errorElement: <ErrorPage />,
				children: [
					{ path: '/', element: <List /> },
					{ path: '/post-submission', element: <PostSubmission /> },
					{ path: '/board', element: <Board /> },
					{ path: '/timeline', element: <Timeline /> },
					{ path: '/import/tracker', element: <TrackerWizard /> },
					{ path: '/opportunity/:id', element: <OpportunityOverview /> },
					{ path: '/opportunity/:id/attachments', element: <AttachmentsPage /> },
					{ path: '/opportunity/:id/compliance', element: <ComplianceMatrix /> },
					{ path: '/opportunity/:id/clarifications', element: <ClarificationsPage /> },
					{ path: '/opportunity/:id/pricing', element: <PricingPage /> },
					{ path: '/opportunity/:id/approvals', element: <ApprovalsPage /> },
					{ path: '/opportunity/:id/submission', element: <SubmissionPage /> },
					{ path: '/opportunity/:id/outcome', element: <OutcomePage /> },
					{ path: '/approvals/review', element: <ApprovalReviewPage /> },
					{ path: '/awards/staging', element: <AwardsStagingPage /> },
					{ path: '/awards/events', element: <AwardsEventsPage /> },
					{ path: '/tenders/available', element: <AvailableTendersPage /> },
					{ path: '/notifications', element: <NotificationsPage /> },
					{ path: '/search', element: <AttachmentSearchPage /> },
					{ path: '/settings/sla', element: <SlaSettingsPage /> },
					{ path: '/admin/users', element: <UsersPage /> },
					{ path: '/admin/business-roles', element: <BusinessRolesPage /> }
				]
			}
		]
	},
	{ path: '/auth/callback', element: <Callback /> },
	{ path: '/auth/dev', element: <DevLogin /> },
	{ path: '*', element: <Navigate to="/" replace /> }
])

export default function AppRouter() {
	return <RouterProvider router={router} />
}
