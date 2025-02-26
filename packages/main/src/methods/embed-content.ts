/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  BatchEmbedContentsRequest,
  BatchEmbedContentsResponse,
  EmbedContentRequest,
  EmbedContentResponse,
} from "../../types";
import { Task, getUrl, makeRequest } from "../requests/request";

export async function embedContent(
  apiKey: string,
  model: string,
  params: EmbedContentRequest,
): Promise<EmbedContentResponse> {
  const url = getUrl(model, Task.EMBED_CONTENT, apiKey, false);
  const response = await makeRequest(url, JSON.stringify(params));
  return response.json();
}

export async function batchEmbedContents(
  apiKey: string,
  model: string,
  params: BatchEmbedContentsRequest,
): Promise<BatchEmbedContentsResponse> {
  const url = getUrl(model, Task.BATCH_EMBED_CONTENTS, apiKey, false);
  const requestsWithModel: EmbedContentRequest[] = params.requests.map(
    (request) => {
      return { ...request, model: `models/${model}` };
    },
  );
  const response = await makeRequest(
    url,
    JSON.stringify({ requests: requestsWithModel }),
  );
  return response.json();
}
