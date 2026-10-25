Build PHASE 3 of ClassPresenter.

IMPORTANT:
Do not rebuild the application.

Preserve all functionality from Phase 1 and Phase 2.

The goal of Phase 3 is to transform ClassPresenter into a production-ready SaaS platform that can be offered to teachers, lecturers, trainers, schools, churches, organizations, coaches, and professional presenters.

--------------------------------------------------
1. USER ACCOUNTS
--------------------------------------------------

Implement secure user authentication.

Users should be able to:

- Sign up
- Log in
- Log out
- Reset password
- Manage profile

User profile should contain:

- Name
- Email
- Profile photo
- Organization/institution
- Default presentation preferences

Each user's presentations and settings must be isolated from other users.

--------------------------------------------------
2. CLOUD PRESENTATION LIBRARY
--------------------------------------------------

Allow authenticated users to store presentations in their personal cloud library.

Each user should have:

- Presentations
- Timer presets
- Presentation sessions
- Personal settings

Users should be able to:

Upload
Open
Present
Rename
Delete
Search
Sort

presentations.

--------------------------------------------------
3. DASHBOARD
--------------------------------------------------

Create a polished SaaS dashboard.

Dashboard sections:

Overview
My Presentations
Timer Presets
Presentation Sessions
Settings
Account

Overview should show useful information such as:

Total presentations
Presentations this month
Total presentation sessions
Most recently used presentation

Keep the dashboard simple.

--------------------------------------------------
4. SUBSCRIPTION SYSTEM
--------------------------------------------------

Design the application to support multiple subscription plans.

Start with three plans.

FREE
For users who want to try ClassPresenter.

PRO
For individual teachers and professional presenters.

TEAM
For schools, organizations, churches, training companies, and teams.

Do not hard-code arbitrary pricing.

Create a pricing configuration system so pricing can be changed later without rebuilding the application.

--------------------------------------------------
5. FEATURE LIMITS
--------------------------------------------------

Create a feature entitlement system.

Potential limits include:

Number of stored presentations
Cloud storage
Timer presets
Presentation history
Advanced timer themes
Advanced warnings
Presenter View
Desktop application access
Team collaboration

The system should check subscription entitlements before allowing restricted features.

Do not simply hide features visually.

The backend must enforce access rules.

--------------------------------------------------
6. BILLING ARCHITECTURE
--------------------------------------------------

Prepare the application for subscription payments.

Create a billing architecture that can integrate with a payment provider appropriate for the target market.

Support:

Subscription creation
Subscription status
Upgrade
Downgrade
Cancellation
Renewal
Payment failure

Do not store payment card information directly in the application.

Use the payment provider's secure checkout/payment infrastructure.

Keep the payment provider integration modular so it can be changed later.

--------------------------------------------------
7. TEAM ACCOUNTS
--------------------------------------------------

For the TEAM plan, allow organizations to create teams.

A team can contain:

Owner
Administrator
Members

Allow team members to share presentations where permitted.

Create permission levels.

Example:

Owner
Admin
Presenter
Viewer

Keep permissions simple in the first implementation.

--------------------------------------------------
8. SHARED PRESENTATIONS
--------------------------------------------------

Allow users with appropriate permissions to share presentations with team members.

A presentation should support:

Private
Team Only
Shared

Do not make presentations public by default.

--------------------------------------------------
9. PRESENTATION ANALYTICS
--------------------------------------------------

Add basic analytics.

For each presentation show:

Number of presentation sessions
Total presentation time
Average session duration
Last presented
Timer completion rate

For organizations, allow basic aggregate statistics.

Avoid collecting unnecessary personal information.

--------------------------------------------------
10. PUBLIC LANDING PAGE
--------------------------------------------------

Create a polished marketing website for ClassPresenter.

Hero headline should communicate the core value clearly.

Example concept:

"Present with confidence. Keep your time in sight."

Explain:

Upload your presentation.
Set your timer.
Start presenting.
Keep your time visible.

Include sections for:

Problem
Solution
Features
How it works
Use cases
Pricing
FAQ
Call to action

Primary CTA:

"Start Presenting"

Secondary CTA:

"See How It Works"

--------------------------------------------------
11. USE CASES
--------------------------------------------------

Create use-case sections for:

Teachers
Lecturers
Trainers
Tutors
Church teachers
Workshop facilitators
Corporate presenters
Coaches

Explain the timing problem and how ClassPresenter addresses it.

Do not make exaggerated claims.

--------------------------------------------------
12. ONBOARDING
--------------------------------------------------

Create a simple onboarding experience after registration.

Ask:

What do you use ClassPresenter for?

Options:

Teaching
Training
Church/Ministry
Business
Workshops
Personal presentations
Other

Then allow the user to immediately upload their first presentation.

The onboarding should get users to their first presentation quickly.

--------------------------------------------------
13. PRODUCT EXPERIENCE
--------------------------------------------------

The core workflow should remain extremely simple:

Upload presentation
↓
Configure timer
↓
Start presentation
↓
Present
↓
Review session

Do not allow SaaS features to make the actual presentation experience complicated.

The presentation screen should remain distraction-free.

--------------------------------------------------
14. SETTINGS
--------------------------------------------------

Create settings for:

Account
Presentation
Timer
Notifications
Subscription
Team
Security

Users should be able to configure default timer behavior.

--------------------------------------------------
15. SECURITY
--------------------------------------------------

Implement appropriate security practices.

Ensure:

Users cannot access another user's presentations.
Users cannot access another team's data.
Subscription entitlements are enforced server-side.
Authentication is handled securely.
File access is protected.

Do not expose private presentation files through predictable public URLs.

--------------------------------------------------
16. PRODUCT ANALYTICS
--------------------------------------------------

Create privacy-conscious product analytics for administrators.

Track high-level events such as:

Account created
Presentation uploaded
Presentation started
Presentation completed
Timer started
Subscription started
Subscription upgraded

Do not collect unnecessary sensitive information.

--------------------------------------------------
17. ADMIN DASHBOARD
--------------------------------------------------

Create an administrator interface for the product owner.

Admin should be able to see:

Total users
Active users
Presentations uploaded
Presentation sessions
Subscription distribution
Storage usage

Provide basic user management.

Do not expose users' private presentation content unnecessarily.

--------------------------------------------------
18. MOBILE EXPERIENCE
--------------------------------------------------

The SaaS dashboard should be responsive on mobile devices.

However, prioritize desktop for the actual presentation experience.

Mobile should primarily be useful for:

Account management
Presentation library
Timer preset management
Subscription management
Settings

--------------------------------------------------
19. PRODUCT ARCHITECTURE
--------------------------------------------------

Keep the architecture modular.

Separate:

Authentication
Users
Presentations
Presentation engine
Timer engine
Sessions
Subscriptions
Billing
Teams
Analytics
Settings

The timer engine must remain independent from the SaaS billing/account system.

The presentation engine must remain independent from subscription logic.

--------------------------------------------------
20. PHASE 3 SUCCESS CRITERIA
--------------------------------------------------

Phase 3 is successful when ClassPresenter has:

- User accounts
- Cloud presentation storage
- Professional dashboard
- Timer presets
- Presentation history
- Subscription architecture
- Free/Pro/Team plan architecture
- Billing integration readiness
- Team functionality
- Basic analytics
- Landing page
- Onboarding
- Settings
- Security controls
- Admin dashboard

Most importantly:

A new teacher should be able to visit ClassPresenter, create an account, upload a PPTX, configure a timer, click "Start Presentation," and begin teaching within minutes.

The actual presentation workflow must remain simple even as the SaaS platform becomes more powerful.
