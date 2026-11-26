import mitt, { type Emitter } from "mitt";

type Events = {
    sessionCreated: void;
    sessionDeleted: string;
    sessionUpdated: string;
    articleDeleted: void;
};

export const eventBus: Emitter<Events> = mitt<Events>();