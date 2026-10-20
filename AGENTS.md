<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Tour 360: scene data lives in src/data/tour.json (CDN image URLs); Pannellum is vendored in public/vendor and loaded once through the shared browser-only loader, because it touches window at import.
- Change Pannellum hotspots only after the viewer's load event and keep viewer failures inside a local fallback, because hotspot calls before load throw and would blank the page.
- Tour motion configuration lives in a browser-safe helper and is applied when creating viewers; honor reduced-motion preferences and preserve a manual playback override across scene changes.
- Administrative access uses a server-verified shared-password encrypted cookie with no time expiry (owner's request); it stays valid until logout, and every privileged operation rechecks the cookie.
- Store only editable hotspot configuration in Cloud draft/published records and append published versions; preserve original scene imagery and load only published data anonymously.
- Use Pannellum coordinates with pointer capture for editing, separating spatial position from icon rotation; public viewers never accept browser-local overrides.
