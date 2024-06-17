/* 
 * Copyright (C) 2019-2024 Jake Coffman (jake@jakecoffman.com)
 * Copyright (C) 2024 Solution Libre (contact@solution-libre.fr)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *         http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
*/

export default {
    /**
     * The Guacamole connection has not yet been attempted.
     *
     * @type String
     */
    IDLE: "IDLE",

    /**
     * The Guacamole connection is being established.
     *
     * @type String
     */
    CONNECTING: "CONNECTING",

    /**
     * The Guacamole connection has been successfully established, and the
     * client is now waiting for receipt of initial graphical data.
     *
     * @type String
     */
    WAITING: "WAITING",

    /**
     * The Guacamole connection has been successfully established, and
     * initial graphical data has been received.
     *
     * @type String
     */
    CONNECTED: "CONNECTED",

    /**
     * The Guacamole connection has terminated successfully. No errors are
     * indicated.
     *
     * @type String
     */
    DISCONNECTED: "DISCONNECTED",

    /**
     * The Guacamole connection has terminated due to an error reported by
     * the client. The associated error code is stored in statusCode.
     *
     * @type String
     */
    CLIENT_ERROR: "CLIENT_ERROR",

    /**
     * The Guacamole connection has terminated due to an error reported by
     * the tunnel. The associated error code is stored in statusCode.
     *
     * @type String
     */
    TUNNEL_ERROR: "TUNNEL_ERROR"
}
