import { gql } from "../../deps.ts";

export const build = gql`
  query build($src: String!) {
    build(src: $src)
  }
`;

export const deploy = gql`
  query deploy($src: String!, $token: String!, $cache: Boolean!) {
    deploy(src: $src, token: $token, cache: $cache)
  }
`;
