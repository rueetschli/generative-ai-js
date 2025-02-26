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

import { expect, use } from "chai";
import { match, restore, stub } from "sinon";
import * as sinonChai from "sinon-chai";
import * as chaiAsPromised from "chai-as-promised";
import { getMockResponse } from "../../test-utils/mock-response";
import * as request from "../requests/request";
import { generateContent } from "./generate-content";
import { HarmBlockThreshold, HarmCategory } from "../../types";

use(sinonChai);
use(chaiAsPromised);

const fakeRequestParams = {
  contents: [{ parts: [{ text: "hello" }], role: "user" }],
  generateConfig: {
    topK: 16,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
  ],
};

describe("generateContent()", () => {
  afterEach(() => {
    restore();
  });
  it("short response", async () => {
    const mockResponse = getMockResponse(
      "unary-success-basic-reply-short.json",
    );
    const makeRequestStub = stub(request, "makeRequest").resolves(
      mockResponse as Response,
    );
    const result = await generateContent("key", "model", fakeRequestParams);
    expect(result.response.text()).to.include("Helena");
    expect(makeRequestStub).to.be.calledWith(
      match.string,
      match((value) => {
        return value.includes("contents");
      }),
    );
  });
  it("long response", async () => {
    const mockResponse = getMockResponse("unary-success-basic-reply-long.json");
    const makeRequestStub = stub(request, "makeRequest").resolves(
      mockResponse as Response,
    );
    const result = await generateContent("key", "model", fakeRequestParams);
    expect(result.response.text()).to.include("Use Freshly Ground Coffee");
    expect(result.response.text()).to.include("30 minutes of brewing");
    expect(makeRequestStub).to.be.calledWith(match.string, match.any);
  });
  it("citations", async () => {
    const mockResponse = getMockResponse("unary-success-citations.json");
    const makeRequestStub = stub(request, "makeRequest").resolves(
      mockResponse as Response,
    );
    const result = await generateContent("key", "model", fakeRequestParams);
    expect(result.response.text()).to.include("Quantum mechanics is");
    expect(
      result.response.candidates[0].citationMetadata.citationSources.length,
    ).to.equal(1);
    expect(makeRequestStub).to.be.calledWith(match.string, match.any);
  });
  it("blocked prompt", async () => {
    const mockResponse = getMockResponse(
      "unary-failure-prompt-blocked-safety.json",
    );
    const makeRequestStub = stub(request, "makeRequest").resolves(
      mockResponse as Response,
    );
    const result = await generateContent("key", "model", fakeRequestParams);
    expect(result.response.text).to.throw("SAFETY");
    expect(makeRequestStub).to.be.calledWith(match.string, match.any);
  });
  it("finishReason safety", async () => {
    const mockResponse = getMockResponse(
      "unary-failure-finish-reason-safety.json",
    );
    const makeRequestStub = stub(request, "makeRequest").resolves(
      mockResponse as Response,
    );
    const result = await generateContent("key", "model", fakeRequestParams);
    expect(result.response.text).to.throw("SAFETY");
    expect(makeRequestStub).to.be.calledWith(match.string, match.any);
  });
  it("empty content", async () => {
    const mockResponse = getMockResponse("unary-failure-empty-content.json");
    const makeRequestStub = stub(request, "makeRequest").resolves(
      mockResponse as Response,
    );
    const result = await generateContent("key", "model", fakeRequestParams);
    expect(result.response.text()).to.equal("");
    expect(makeRequestStub).to.be.calledWith(match.string, match.any);
  });
  it("unknown enum - should ignore", async () => {
    const mockResponse = getMockResponse("unary-unknown-enum.json");
    const makeRequestStub = stub(request, "makeRequest").resolves(
      mockResponse as Response,
    );
    const result = await generateContent("key", "model", fakeRequestParams);
    expect(result.response.text()).to.include("30 minutes of brewing");
    expect(makeRequestStub).to.be.calledWith(match.string, match.any);
  });
  it("image rejected (400)", async () => {
    const mockResponse = getMockResponse("unary-failure-image-rejected.json");
    const mockFetch = stub(globalThis, "fetch").resolves({
      ok: false,
      status: 400,
      json: mockResponse.json,
    } as Response);
    await expect(
      generateContent("key", "model", fakeRequestParams),
    ).to.be.rejectedWith(/400.*invalid argument/);
    expect(mockFetch).to.be.called;
  });
});
