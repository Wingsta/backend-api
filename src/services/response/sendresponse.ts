

export const sendResponse = (data : any, message: string = 'success', error: boolean = false) => {
    return {
        data ,
        message,
        error,
        status : !!error
    }
}

export const sendSuccessResponse = (data: any, message: string = "success") => {
  return {
    data,
    message,
    error: false,
    status: true,
  };
};

export const sendErrorResponse = ( message: string = "success") => {
  return {
    data: null,
    message,
    error: true,
    status: false,
  };
};