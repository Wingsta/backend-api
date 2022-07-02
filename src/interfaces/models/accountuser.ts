/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */

export interface IAccessToken {
  accessToken: string;
  data_access_expiration_time: number;
  userID: string;
  type: "FACEBOOK" | "GOOGLE";
}

export interface IAccountUser {
  email: string;
  expiresIn: number;
  graphDomain: string;
  name: string;
  userID: string;
  picture: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
}


