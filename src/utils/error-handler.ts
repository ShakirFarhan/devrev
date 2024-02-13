import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError } from 'graphql';

export const ErrorTypes = {
  BAD_USER_INPUT: {
    errorCode: ApolloServerErrorCode.BAD_USER_INPUT,
    errorStatus: 400,
  },
  BAD_REQUEST: {
    errorCode: ApolloServerErrorCode.BAD_REQUEST,
    errorStatus: 400,
  },
  NOT_FOUND: {
    errorCode: 'NOT_FOUND',
    errorStatus: 404,
  },
  UNAUTHENTICATED: {
    errorCode: 'UNAUTHENTICATED',
    errorStatus: 401,
  },
  FORBIDDEN: {
    errorCode: 'UNAUTHENTICATED',
    errorStatus: 403,
  },
  ALREADY_EXISTS: {
    errorCode: 'ALREADY_EXISTS',
    errorStatus: 400,
  },
  INTERNAL_SERVER_ERROR: {
    errorCode: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
    errorStatus: 500,
  },
};

//throwCustomError function

type errorTypePayload = {
  errorCode: String;
  errorStatus: number;
  redirect?: string;
};

export default (errorMessage: string, errorType: errorTypePayload) => {
  throw new GraphQLError(errorMessage, {
    extensions: {
      code: errorType.errorCode,
      http: {
        status: errorType.errorStatus,
      },
    },
  });
};

export const catchErrorHandler = (error: any) => {
  let errorStatus;
  let errorType;
  if (error instanceof GraphQLError && error.extensions) {
    const { extensions } = error;
    if (extensions?.code) {
      errorType = extensions.code;
    }
    if (extensions.http && typeof extensions.http === 'object') {
      const { status } = extensions.http as { status: number };
      if (typeof status === 'number') {
        errorStatus = status;
      }
    }
  } else {
    errorStatus = error.errorType?.errorStatus || 500;
  }

  throw new GraphQLError(error.meta?.cause || error.message, {
    extensions: {
      code: errorType,
      http: {
        status: errorStatus,
      },
    },
  });
};
