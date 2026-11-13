import type { ReactElement } from "react";

/**
 * One JSON-LD block.
 *
 * `dangerouslySetInnerHTML` is the documented way to emit structured data from
 * React, because a `<script>` child would be rendered as text rather than as the
 * script's content. The one hazard is content containing `</script>`, which would
 * close the tag early; `<` is escaped to its JSON escape so a string can never do
 * that. JSON.parse reads the escape back as the same character, so this changes
 * nothing for a consumer.
 *
 * Every page emits its structured data through this component rather than writing
 * the tag again, so the escaping exists in one place and a page cannot forget it.
 */
export default function JsonLd({ data }: { data: unknown }): ReactElement {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
