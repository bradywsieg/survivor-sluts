---
name: Season scoring backfills
description: Why scoring-rule additions should not replay the entire current default rubric onto existing seasons
---

When introducing scoring events, backfill only the newly introduced event keys into seasons that already have a rubric. Seed the full default rubric only for empty or newly created seasons. Preserve existing point values.

**Why:** Historical season rubrics can have older spellings or keys for similar events. Replaying all current defaults into a populated season introduced duplicate-looking rules alongside the historical ones.

**How to apply:** Keep newly introduced rules identifiable as a separate group when adding defaults. Verify the number of added rows and that an existing customized point value stays unchanged.