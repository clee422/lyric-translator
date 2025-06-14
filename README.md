# lyric-translator

A Spotify web player that displays translated and romanized song lyrics.

**Live Demo:** https://lyric-translator.vercel.app/

## Built With

### Frontend

-   React

### Backend

-   Node.js
-   MongoDB

### Authorization

-   Spotify OAuth 2.0
-   Google OAuth 2.0

### Deployment

-   Vercel (client)
-   Render (server)

## Running the App Locally

### Prerequisites

-   [Node.js](https://nodejs.org/en), runtime environment

### API setup

#### _Spotify_

1.  Create a new app on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
    -   Add `http://127.0.0.1:10000/auth/spotify/callback` as a **Redirect URI**
    -   Check **_Web API_** and **_Web Playback SDK_** for API/SDKs that are planned to be used
2.  Take note of the newly created Spotify app's **Client ID** and **Client Secret** for later

#### _Google_

1.  Create a new project on the [Google Cloud Console](https://console.cloud.google.com/) and select it as the current project

2.  Select the newly created project in the project picker found on the top menu in the Google Cloud Console

    -   Take note of the project's **ID** for later

3.  Navigate to the [Cloud Translation API](https://console.cloud.google.com/apis/library/translate.googleapis.com?inv=1&invt=Ab0C-A) page and enable the API for your project

4.  Configure [Google Auth Platform](https://console.cloud.google.com/auth/overview?inv=1&invt=Ab0DFw) for your project

5.  Add your Google account as a test user on the [Audience page](https://console.cloud.google.com/auth/audience?inv=1&invt=Ab0C-A)

6.  Navigate to the [Client page](https://console.cloud.google.com/auth/clients?inv=1&invt=Ab0C-A) to create an OAuth 2.0 client

    -   Select **_Web application_** as your **Application Type**
    -   Add `http://127.0.0.1:10000/auth/google/callback` as an **Authorized redirect URI**

7.  Take note of the OAuth 2.0 client's **Client ID** and **Client Secret** for later

### Installation

1.  Clone the repo

    ```
    git clone https://github.com/clee422/lyric-translator.git
    ```

2.  Install node dependencies
    ```
    npm install
    ```

### .env file

In the root directory of the cloned project, create a `.env` file with the following contents:

```
NODE_ENV="development"
APP_CLIENT_URL="http://127.0.0.1:3000"
APP_SERVER_URL="http://127.0.0.1:10000"
PORT=10000
MONGO_URI="mongodb://localhost:27017/lyric-translator"
PROJECT_REPO_URL="https://github.com/clee422/lyric-translator"
VITE_APP_SERVER_URL="http://127.0.0.1:10000"


# REPLACE ALL THE VARIABLES BELOW

SESSION_SECRET="<random-string-of-at-least-16-characters>"

SPOTIFY_CLIENT_ID="<spotify-client-id-from-API-setup>"
SPOTIFY_CLIENT_SECRET="<spotify-client-secret-from-API-setup>"

GOOGLE_PROJECT_ID="<google-project-id-from-API-setup>"
GOOGLE_CLIENT_ID="<google-client-id-from-API-setup>"
GOOGLE_CLIENT_SECRET="<google-client-secret-from-API-setup>"
```

### Running the app

1.  Start the app
    ```
    npm run dev
    ```
2.  Test the app at [http://127.0.0.1:3000](http://127.0.0.1:3000)
