declare module "*.css" {
  const stylesheet: Record<string, string>;
  export default stylesheet;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
