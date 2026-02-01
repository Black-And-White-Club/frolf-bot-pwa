This project includes helpers (`isUnsplashUrl`, `unsplashSrcset`, `unsplashSizes`) to optimize delivery of Unsplash-hosted images.

What these helpers do:

- Detect `images.unsplash.com` URLs.
- Build safe `srcset` query params to request multiple widths and ask Unsplash to `auto=format` (AVIF/WebP) which reduces payload.
- Provide a `sizes` string suitable for the target pixel size.

Usage examples:

In Svelte components:

```svelte
<img
	src={avatar_url}
	srcset={isUnsplashUrl(avatar_url) ? unsplashSrcset(avatar_url, [48, 100]) : undefined}
	sizes={isUnsplashUrl(avatar_url) ? unsplashSizes(48) : undefined}
	loading="lazy"
/>
```

Notes:

- Prefer preconnecting to `https://images.unsplash.com` in your root HTML for faster requests.
- Consider using a proxy/CDN for production to control caching and image resizing for non-Unsplash images.
