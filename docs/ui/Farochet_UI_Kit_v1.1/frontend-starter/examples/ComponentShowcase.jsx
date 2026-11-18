import React, { useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import TextField from "../components/ui/TextField";
import TextArea from "../components/ui/TextArea";
import StatusBadge from "../components/ui/StatusBadge";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import CrochetFlower from "../components/brand/CrochetFlower";

/** Temporary page to inspect the shared styles. Remove or keep as an internal route. */
export default function ComponentShowcase() {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <main className="farochet-container" style={{ paddingBlock: 40, display: "grid", gap: 24 }}>
      <header>
        <p style={{ color: "var(--color-plum)", fontWeight: 700, letterSpacing: ".08em" }}>FAROCHET DESIGN SYSTEM</p>
        <h1>Shared Component Showcase</h1>
        <p>Use this page to review the shared palette, controls, and component states.</p>
      </header>

      <Card title="Buttons" description="Use one primary action per decision area.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Text action</Button>
          <Button variant="danger">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Card>

      <Card title="Form controls" description="Labels remain visible; placeholders are only examples.">
        <div style={{ display: "grid", gap: 16, maxWidth: 620 }}>
          <TextField id="showcase-name" label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
          <TextArea id="showcase-notes" label="Additional details" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Write a few details…" />
        </div>
      </Card>

      <Card title="Status presentation" description="Caller supplies approved status labels and a visual tone.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <StatusBadge label="Pending" tone="pending" />
          <StatusBadge label="In Progress" tone="active" />
          <StatusBadge label="Completed" tone="success" />
          <StatusBadge label="Cancelled" tone="danger" />
          <StatusBadge label="On Hold" tone="hold" />
        </div>
      </Card>

      <Alert tone="success" title="Success feedback">Show this only after the relevant operation succeeds.</Alert>
      <Card title="Decorative illustration" description="Use the crochet-flower detail sparingly, especially on customer pages.">
        <CrochetFlower size={96} />
      </Card>
      <Card>
        <EmptyState title="No saved items yet" description="Browse the catalogue and save the creations you love." illustration={<CrochetFlower size={72} />} action={<Button variant="outline">Explore catalogue</Button>} />
      </Card>
    </main>
  );
}
