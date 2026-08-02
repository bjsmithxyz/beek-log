/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: { login: string } | null;
  }
}
