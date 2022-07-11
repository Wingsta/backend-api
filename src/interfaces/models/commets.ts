interface From {
  id: string;
  username: string;
}

interface Media {
  id: string;
  media_product_type: string;
}

export interface IComment {
  from: From;
  media: Media;
  id: string;
  parent_id: string;
  text: string;
  meta : Record<string,any>;
}
