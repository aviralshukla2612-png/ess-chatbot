export class NextResponse extends globalThis.Response {
  static json(data, init = {}) {
    const body = JSON.stringify(data);
    const headers = new Headers(init.headers || {});
    headers.set("content-type", "application/json");
    const res = new NextResponse(body, { ...init, headers });
    return res;
  }
}

// Ensure res.cookies.set helper exists on instances
const origJson = NextResponse.json;
NextResponse.json = function (data, init = {}) {
  const res = origJson.call(NextResponse, data, init);
  res.cookies = {
    set: (cookieObj) => {
      const parts = [`${cookieObj.name}=${cookieObj.value}`];
      if (cookieObj.path) parts.push(`Path=${cookieObj.path}`);
      if (cookieObj.httpOnly) parts.push("HttpOnly");
      if (cookieObj.sameSite) parts.push(`SameSite=${cookieObj.sameSite}`);
      if (cookieObj.maxAge) parts.push(`Max-Age=${cookieObj.maxAge}`);
      res.headers.set("set-cookie", parts.join("; "));
    },
  };
  return res;
};
