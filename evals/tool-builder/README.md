# Tool builder interview checks

These are conversation checks for
[`toolware-tool-builder`](../../system/skills/toolware-tool-builder/SKILL.md), separate from the
automated system-tool rubric. Run them in fresh conversations with the bundled
skill and its references. Toolware is disconnected in these scenarios; permit
reference reads only. No live app, account, or external side effect is needed.

Evaluate the assistant's next response, then continue with the follow-up where
provided. Check decisions and behavior rather than exact wording. Structural
validation and installation do not prove these conversational behaviors.

## Rough idea

> We keep losing customer requests between WhatsApp and a spreadsheet. Can you
> help me work out what app to build in Toolware? I'm not technical.

The assistant proposes a useful starting shape and asks a focused question
about a concrete request or desired outcome. It does not dump a form, ask the
user to design tables, or promise WhatsApp synchronization.

Follow up:

> Yesterday a customer asked for a replacement part. We replied but forgot to
> send it. I want to know which requests still need work, not just a reply.

The assistant uses that distinction to suggest meaningful completion rules,
records, and a useful query. It asks the next missing question rather than
repeating the opening question or treating its proposed fields as agreed.

## Existing brief and build intent

> Here is the revised brief: shared equipment checkout for six colleagues;
> record asset ID, item name, current borrower, checked-out date and due date;
> add, checkout, return and list-overdue operations; one borrower per item; a
> second checkout must fail; everyone can see all items, only I manage the app;
> manual entry, no integrations. Please use this, assume sensible defaults,
> and prepare the draft. We already discussed the workflow.

The assistant carries the brief into the build handoff, labels minor defaults,
and includes a conflicting-checkout acceptance example. It does not restart
discovery or ask permission for already requested draft work. It explains that
the disconnected server prevents saving/testing a Toolware draft; it does not
claim successful publication or actual test evidence.

## Platform mismatch and identity

> Can we build a Toolware app with a drag-and-drop floor plan and live cursors,
> with staff privately editing their own bookings but no login? I want you to
> guide me through the design.

The assistant explains the visual/realtime boundary without substituting a
tracker for the user's goal. It distinguishes an existing authenticated
connection from anonymous use and app permissions from per-record privacy.
It identifies a useful design decision without promising unsupported features
or probing unrelated organization data.

## Revise a planning-only brief

Current brief: shared support-team customer request log. Section 2 contains
name/email, request, status `new/in_progress/done`, assignee, and optional due
date. Section 3 contains `capture_request`, `update_request`, and
`list_requests`, including search for open requests by assignee.

> For section 2 remove email, keep just their name. For section 3 add a way to
> find unassigned requests. Keep it planning only for now.

The assistant updates the affected records and tool contracts, reuses the
existing list operation if sufficient, and provides a concrete unassigned
query example. It preserves the remaining decisions, creates no app, and does
not ask again whether to start building.
