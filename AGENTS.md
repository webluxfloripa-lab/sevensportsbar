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

- Tour 360: scene data lives in src/data/tour.json (CDN image URLs); Pannellum is vendored in public/vendor and loaded at runtime in the browser only, because it touches window at import.
- Tour motion configuration lives in a browser-safe helper and is applied when creating viewers; honor reduced-motion preferences and preserve a manual playback override across scene changes.
