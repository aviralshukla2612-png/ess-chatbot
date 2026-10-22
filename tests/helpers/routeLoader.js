export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") {
    return {
      format: "module",
      shortCircuit: true,
      url: new URL("./nextServerMock.js", import.meta.url).href,
    };
  }
  if (specifier.startsWith("@/")) {
    const subpath = specifier.slice(2);
    let target = new URL(`../../frontend/${subpath}`, import.meta.url).href;
    if (!target.endsWith(".js") && !target.endsWith(".json")) {
      target += ".js";
    }
    return {
      format: "module",
      shortCircuit: true,
      url: target,
    };
  }
  if (specifier.startsWith(".") && !specifier.endsWith(".js") && !specifier.endsWith(".json") && context.parentURL) {
    try {
      const candidate = new URL(specifier + ".js", context.parentURL).href;
      return nextResolve(candidate, context);
    } catch (e) {}
  }
  return nextResolve(specifier, context);
}
