// Registers Happy DOM's globals (document, window, ...) once per process, so
// lit-html has a DOM to render into. Deno itself ships no DOM. Every test
// file imports this first; ES module caching means the register call below
// only actually runs once even though many files import it.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
