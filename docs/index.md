---
layout: home

hero:
  name: Kin Form
  text: Form state that stays out of your way
  tagline: "Fast. Lightweight. Framework-agnostic. 100% type-safe."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Why Kin Form?
      link: /guide/
    - theme: alt
      text: API Reference
      link: https://jsr.io/@kin-form

features:
  - icon: 🌳
    title: One model, one class
    details: <code>FieldApi</code> for leaf inputs, nested objects and arrays alike; <code>FormApi</code> is just the <code>FieldApi</code> at the root, plus submit handling. A form is just a tree of nodes, mirroring the DOM's own <code>Node</code>/<code>Document</code> shape.
  - icon: 🔑
    title: Type-safe dot paths
    details: <code>form.field("address.line1")</code> or <code>form.field("items.0.code")</code> type-checks against your value type. <code>DeepKey</code>/<code>DeepValue</code> compute every valid path and its value type — typos are compile errors, not runtime surprises.
  - icon: 🧩
    title: Build once, reuse anywhere
    details: Build a field, group, or button component once — <code>TextField</code>, <code>AddressField</code>, <code>SubmitButton</code> — and mount it anywhere.
  - icon: 🔗
    title: Cross-field validation, declaratively
    details: Declare <code>dependents</code> on a field to re-validate siblings whenever it changes — "confirm password must match password" without wiring up manual subscriptions.
  - icon: 📚
    title: Dynamic arrays
    details: <code>pushItem</code>/<code>insertItem</code>/<code>moveItem</code>/<code>swapItems</code>/<code>removeItem</code> update the immutable value and re-key the field registry together, so a field's identity follows its item through a reorder.
  - icon: 🧪
    title: Two validation models, your choice
    details: Per-node <code>validators</code> for granular rules, or a whole-group <code>schemaValidator</code> adapting any Standard Schema library (zod, valibot, ...).
---

<FeatureMatrix />

<style>
html .VPHero .name {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 20px;
  line-height: 32px;
}
html .VPHero .text {
  font-size: 36px;
  line-height: 40px;
  max-width: 100%;
}
html .VPHero .tagline {
  font-size: 16px;
  line-height: 1.5;
  max-width: 564px;
}

@media (min-width: 640px) {
  html .VPHero .name {
    font-size: 24px;
    line-height: 1.5;
  }

  html .VPHero .text {
    font-size: 44px;
    line-height: 56px;
  }

  html .VPHero .tagline {
    font-size: 20px;
    line-height: 32px;
  }
}

@media (min-width: 960px) {
  html .VPHero .name {
    font-size: 32px;
    line-height: 1.5;
  }

  html .VPHero .text {
    font-size: 56px;
    line-height: 64px;
  }
}
</style>
