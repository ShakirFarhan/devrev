FROM node:18 as builder

WORKDIR /build

COPY package*.json .

RUN npm install

COPY src/ src/

COPY tsconfig.json ./

COPY prisma/ prisma/ 

RUN npm run build

RUN npx prisma generate

FROM node:18 as runner

WORKDIR /app

COPY --from=builder build/package*.json .

COPY --from=builder build/dist dist/

COPY --from=builder build/node_modules node_modules/

COPY --from=builder build/prisma prisma/

EXPOSE 8000

CMD [ "npm","start" ]



