Here's a summary of the main UI components, their functionalities, and their corresponding source files:

I. Core UI Technologies:

ShadCN UI Components (src/components/ui/): The application heavily relies on ShadCN UI for pre-built, accessible, and customizable components like Buttons, Cards, Dialogs, Forms, Inputs, Selects, Tabs, etc. These form the building blocks of most UI elements.
Tailwind CSS (src/app/globals.css, tailwind.config.ts): Used for all styling. globals.css defines the color palette (theme variables for light/dark mode, including primary, accent, background colors) and base styles. tailwind.config.ts configures Tailwind, extends the theme with custom fonts (PT Sans), colors, border radii, and utility classes.
Lucide React Icons: Used for most iconography throughout the application.
II. Main Layout Structure:

Root Layout (src/app/layout.tsx):

Features: Sets up the main HTML structure, imports Google Fonts ('PT Sans'), global CSS, and includes the ThemeProvider for light/dark mode switching and AuthProvider for managing user authentication state. It also initializes the Toaster for notifications.
Files: src/app/layout.tsx
Authentication Layout (src/app/(auth)/layout.tsx):

Features: A simple centered layout for login and signup pages. Uses a themed background.
Files: src/app/(auth)/layout.tsx
Main Application Layout (src/app/(main)/layout.tsx):

Features: Wraps all pages that are part of the authenticated app experience.
Sidebar Navigation: Integrates AppSidebar (src/components/layout/AppSidebar.tsx) for primary navigation. The sidebar is collapsible and uses glassmorphic-sidebar styling.
Content Area: Provides a main content area with appropriate padding that houses the content of individual pages.
Mobile Trigger: Includes a trigger button (PanelLeft icon) for opening the sidebar on mobile devices.
Files: src/app/(main)/layout.tsx, src/components/layout/AppSidebar.tsx
III. Key Pages & Their UI Features:

Authentication Pages (src/app/(auth)/...):

Login (src/app/(auth)/login/page.tsx -> src/components/auth/LoginForm.tsx):
Features: Card-based form with fields for email and password. Includes "Login" button, Google Sign-In option, and a link to the signup page. Uses react-hook-form and zod for validation. Shows loading state on the button during submission and uses toast notifications for feedback.
Signup (src/app/(auth)/signup/page.tsx -> src/components/auth/SignupForm.tsx):
Features: Card-based form for name, email, and password. Includes Google Sign-Up option and a link to the login page. Uses react-hook-form and zod for validation. Shows loading state on the button during submission and uses toast notifications.
Home/Explore Page (src/app/(main)/page.tsx):

Features:
Header: Displays "Explore Adventures" and a "Create Post" button (if logged in).
Post Feed: Displays a list of PostCard components in a scrollable area.
Loading State: Shows a loader while posts are being fetched.
Empty State: Shows a message and a "Share Your Adventure" button if no posts are available.
Key Component File: src/components/posts/PostCard.tsx
Create Post Page (src/app/(main)/create/page.tsx -> src/components/posts/CreatePostForm.tsx):

Features: A comprehensive form to share travel experiences.
Inputs: Title, Location Name (optional), Caption (textarea), Category (select dropdown).
Trip Planning Fields: Optional Start Date & End Date (calendar popovers), Packing List (textarea).
Image Upload: Drag-and-drop or click-to-upload area for up to 5 images, with previews and removal option. Images are uploaded to Cloudinary.
Map Interaction: An InteractiveMap where users can click to pin the location for their post. Displays selected coordinates.
Submission: "Create Post" button with loading state. Uses toast notifications for feedback.
Key Component File: src/components/posts/CreatePostForm.tsx, src/components/map/InteractiveMap.tsx
Map View Page (src/app/(main)/map/page.tsx):

Features:
Header: "Global Adventure Map".
Interactive Map: Displays an InteractiveMap filling most of the page.
Post Markers: Posts are shown as category-specific custom markers on the map. Uses leaflet.markercluster for clustering.
Popups: Clicking a marker shows a brief popup with post image, title, location, truncated caption, and buttons to "Show Route on Map" (if user location available), "Open in Google Maps", and "View Full Details".
Post Detail Dialog: Clicking "View Full Details" opens a dialog (components/ui/dialog) displaying the full PostCard, including a comments section.
Comments: Fetches and displays comments for the selected post. Allows authenticated users to add new comments.
Loading/Empty States: Shows a loader while posts are fetched or an empty state message if no posts exist.
Key Component Files: src/app/(main)/map/page.tsx, src/components/map/InteractiveMap.tsx, src/components/posts/PostCard.tsx
AI Planner Page (src/app/(main)/ai-planner/page.tsx):

Features: A tabbed interface (components/ui/tabs) for different AI-powered travel tools.
Tabs: "Smart Trip Planner", "AI Packing List", "Local Insights", "Weather Advice", each with a relevant icon.
Smart Trip Planner (src/components/ai-planner/TripPlannerForm.tsx):
Inputs: Destination, Start/End Dates (optional calendars), Number of Days (optional), Budget, Interests (textarea), Number of People.
Output: Displays the generated plan using ItineraryDisplay.tsx, showing daily activities, food suggestions, travel tips, recommended places, and cost breakdown in accordion sections.
AI Packing List (src/components/ai-planner/PackingListForm.tsx):
Inputs: Destination, Trip Type, Duration (days), Expected Weather (optional), Gender Context (optional select).
Output: Displays the list using PackingListDisplay.tsx, categorized items, and additional tips.
Local Insights (src/components/ai-planner/LocalInsightsForm.tsx):
Inputs: Destination.
Output: Displays insights using LocalInsightsDisplay.tsx on local customs, safety, what to avoid, and must-try food in accordions.
Weather Advice (src/components/ai-planner/WeatherSuggestionsForm.tsx):
Inputs: Destination, Date/Period.
Output: Displays advice using WeatherSuggestionsDisplay.tsx on typical weather, suitable activities, packing changes, and backup plans in accordions.
Common Features: All forms show loading states on submit buttons and use toast notifications. Results are displayed below the form.
Key Component Files: src/app/(main)/ai-planner/page.tsx, and various files in src/components/ai-planner/
Match Page (src/app/(main)/match/page.tsx):

Features:
Header: "Find Your Travel Match".
Search Radius Slider: Allows users to set a search radius (km) for finding profiles, if their location is available.
Profile Swiping: Displays user profiles one by one using SwipeCard.tsx within a TinderCard component for swipe gestures.
Swipe Buttons: "Skip" (X icon) and "Like" (Heart icon) buttons.
Loading/Empty States: Shows a loader when fetching profiles or a message when no more profiles are available.
Match Popup (src/components/match/MatchPopup.tsx): Displays a celebratory dialog when a mutual like occurs, showing both users' avatars.
Key Component Files: src/app/(main)/match/page.tsx, src/components/match/SwipeCard.tsx, src/components/match/MatchPopup.tsx
Chat Page (src/app/(main)/chat/page.tsx -> src/components/chat/ChatInterface.tsx):

Features: (Currently uses mock data)
Two-Panel Layout:
Contact List (Left): Searchable list of contacts with avatar, name, last message, time, and unread count. Highlights selected user.
Message Area (Right):
Header: Displays selected user's avatar, name, and online status.
Messages: Scrollable area showing messages, differentiating between "me" and "other".
Input: Text input field with buttons for attachments (Paperclip), emojis (Smile), and sending (SendHorizonal).
Empty State: Shows a message if no chat is selected.
Key Component File: src/components/chat/ChatInterface.tsx
Friends Page (src/app/(main)/friends/page.tsx):

Features:
Header: "Your Connections".
Friends Grid: Displays a grid of FriendCard.tsx components for users the current user has matched with.
Loading/Empty States: Shows a loader while fetching friends or a message with a link to the "Match" page if no connections exist.
Key Component File: src/components/friends/FriendCard.tsx
Profile View Page (src/app/(main)/profile/page.tsx):

Features: Displays the current user's profile information.
Header: Avatar, Name, Username, "Edit Profile" button.
Profile Completion: Progress bar and percentage.
Sections (Cards): "Basic Information", "Location & Travel", "Travel Preferences", "Interests & Hobbies", "Match Preferences", "Contact & Verification", each displaying relevant data with icons. Uses ProfileDataItem for consistent display.
Social Links: Displays buttons to external social media profiles if provided.
Joined Date: Shows when the user joined.
Files: src/app/(main)/profile/page.tsx
Edit Profile Page (src/app/(main)/profile/edit/page.tsx):

Features: A comprehensive form to edit the user's profile.
Sections (Cards): "Basic Information" (avatar upload, name, username, DOB, gender, interested in, bio), "Contact & Verification" (phone, social media links, ID verification upload), "Travel Preferences", "Interests & Hobbies", "Location Information" (address input, map pin), "Match Preferences" (age range slider, gender, looking for, smoking/drinking, pet-friendly, expenses), "Safety & Trust" (emergency contact).
Form Elements: Uses various ShadCN inputs, textareas, selects, checkboxes, calendar popover, slider, switch.
Avatar/ID Upload: File input for avatar and ID, with previews. Uses Cloudinary for storage.
Map Integration: InteractiveMap to select/update current location coordinates.
Profile Completion: Dynamically updates a progress bar as the user fills the form.
Submission: "Save All Changes" button with loading state. Uses toast notifications.
Files: src/app/(main)/profile/edit/page.tsx
Upcoming Trips Page (src/app/(main)/upcoming/page.tsx):

Features:
Header: "Upcoming & Ongoing Trips".
Trip Grid: Displays a grid of UpcomingTripCard.tsx components for posts that are upcoming or in-progress.
Loading/Empty States: Shows a loader or an empty state message with a link to plan a new trip.
Key Component File: src/components/trips/UpcomingTripCard.tsx
IV. Key Reusable UI Components (examples):

src/components/posts/PostCard.tsx:
Features: Displays user avatar/name, post timestamp, location label, image carousel (if multiple images), like button (with count, interactive), comment button (with count, can trigger dialog/focus input), share button (dropdown with multiple platforms), save button (interactive). Handles caption truncation with "Read more" option.
src/components/trips/UpcomingTripCard.tsx:
Features: Displays trip image, title, planner's avatar/name, status badge (e.g., "Upcoming", "In Progress") with icon, countdown timer (for upcoming trips), dates, location, participant count, packing list (in an accordion), and a "View Details" button. Includes a mini InteractiveMap preview.
src/components/match/SwipeCard.tsx:
Features: Displays user's avatar as a large background image, name, age, location, bio (truncated), interests (badges), and what they are looking for (badges).
src/components/friends/FriendCard.tsx:
Features: User avatar, name, username, bio (truncated), "View Profile" (placeholder), and "Message" buttons.
This covers the main UI features and their locations within your project. It's a well-structured application with a good separation of concerns!
