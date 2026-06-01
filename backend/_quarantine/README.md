# Quarantined (unbuilt) features

These route/service files were scaffolded but depend on ~75 Mongoose models
that were never defined in `db/index.ts`, and none were registered in `server.ts`
(i.e. the running server never loaded them). They are excluded from the build
via the root `_quarantine` entry in `tsconfig.json`.

To reclaim a feature: move its files back, define the required models in
`db/index.ts`, register the route in `server.ts`, and resolve type errors.
