import {RouteConfigEntry as rrRouteConfigEntry} from "../react-router";
import {RouteConfigEntry as remixRouteConfigEntry} from "../remix";

export type RouteConfigEntry = rrRouteConfigEntry & remixRouteConfigEntry
