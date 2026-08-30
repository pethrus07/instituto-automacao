/** Os CSS de design/ chegam como texto (regra Text no wrangler.toml). */
declare module '*.css' {
  const conteudo: string;
  export default conteudo;
}
