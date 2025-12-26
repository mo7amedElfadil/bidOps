import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
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
import LifecycleSettingsPage from './pages/Settings/Lifecycle'
import SystemSettingsPage from './pages/Settings/System'
import NotificationsPage from './pages/Notifications/Index'
import ErrorPage from './components/ErrorPage'
import { getMustChangePassword, getToken } from './utils/auth'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import AcceptInvite from './pages/Auth/AcceptInvite'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'
import ChangePassword from './pages/Auth/ChangePassword'
import AccountPage from './pages/Account/Index'

function RequireAuth() {
	const loc = useLocation()
	const token = typeof window !== 'undefined' ? getToken() : null
	if (!token) {
		return <Navigate to="/auth/login" replace />
	}
	if (getMustChangePassword() && loc.pathname !== '/auth/change-password') {
		return <Navigate to="/auth/change-password" replace />
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
					{ path: '/', element: <Dashboard /> },
					{ path: '/dashboard', element: <Dashboard /> },
					{ path: '/opportunities', element: <List /> },
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
					{ path: '/account', element: <AccountPage /> },
					{ path: '/awards/staging', element: <AwardsStagingPage /> },
					{ path: '/awards/events', element: <AwardsEventsPage /> },
					{ path: '/tenders/available', element: <AvailableTendersPage /> },
					{ path: '/notifications', element: <NotificationsPage /> },
					{ path: '/search', element: <AttachmentSearchPage /> },
					{ path: '/settings/sla', element: <SlaSettingsPage /> },
					{ path: '/settings/lifecycle', element: <LifecycleSettingsPage /> },
					{ path: '/settings/system', element: <SystemSettingsPage /> },
					{ path: '/admin/users', element: <UsersPage /> },
					{ path: '/admin/business-roles', element: <BusinessRolesPage /> }
				]
			}
		]
	},
	{ path: '/auth/callback', element: <Callback /> },
	{ path: '/auth/login', element: <Login /> },
	{ path: '/auth/signup', element: <Signup /> },
	{ path: '/auth/accept-invite', element: <AcceptInvite /> },
	{ path: '/auth/forgot-password', element: <ForgotPassword /> },
	{ path: '/auth/reset-password', element: <ResetPassword /> },
	{ path: '/auth/change-password', element: <ChangePassword /> },
	{ path: '/auth/dev', element: <DevLogin /> },
	{ path: '*', element: <Navigate to="/" replace /> }
])

export default function AppRouter() {
	return <RouterProvider router={router} />
}
