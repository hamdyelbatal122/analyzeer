# Analyzeer

A while back Deezer sent me an email with statistics on what I listened to for the last month. As someone who discovers and listens to hours of music a week, I thought it was really cool to see. Sadly, I didn't receive another mail like this the following month, nor the month after that, so I decided to implement something myself using Deezer's API. Analyzeer was born.

## Running this app yourself

First, create [a new Deezer application](https://developers.deezer.com/myapps). You'll need the Application ID and Secret Key.

### Now
To deploy this app in production using [Now](https://zeit.co/now), set a [secret](https://zeit.co/docs/getting-started/secrets) named `analyzeer-settings` containing the following:

```json
{"appid": 123456,"secret_key": "your deezer app secret key","url": "the base url for the app, including https://","port": 9090}
```

Then, run `now GitSquared/analyzeer`. See [Now's documentation on deploying git repos](https://zeit.co/docs/features/repositories) for more info on this command.

### Running locally (static)
Clone the repository, then create a `now-secrets.json` at the root of your clone containing the following:

```json
{
    "@analyzeer-settings": "your settings string following the template in the 'Now' section above"
}
```

Then `npm run build` and finally `npm start`. Make sure the port you defined is available.

### Running in "dev mode" (live recompilation)
(Only works on \*nix systems for now, requires bash)

Follow the instructions in "Running locally" above, and use `npm run live` instead of build & start. The webapp's logic and all "static" files will be reloaded and recompiled automatically when changed on-disk. Also, in dev mode, a data sample is used instead of actually using Deezer's API.
