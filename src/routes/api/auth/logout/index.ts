import { RequestHandler } from "@builder.io/qwik-city";
import { SESSION_COOKIE } from "~/utils/auth";

export const onPost: RequestHandler = async ({ cookie, redirect }) => {
  cookie.delete(SESSION_COOKIE, { path: "/" });
  throw redirect(302, "/login");
};
