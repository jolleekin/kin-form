import { ref, watch } from "vue";

const isClient = typeof window !== "undefined";
const defaultFramework = "react";

export const selectedFramework = ref(
  isClient
    ? localStorage.getItem("kin-form-framework") || defaultFramework
    : defaultFramework,
);

if (isClient) {
  watch(selectedFramework, (newVal) => {
    localStorage.setItem("kin-form-framework", newVal);
  });
}
