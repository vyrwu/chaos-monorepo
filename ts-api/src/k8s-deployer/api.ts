/* tslint:disable */
/* eslint-disable */
/**
 * K8s Deployer - OpenAPI 3.0
 * Service for deploying services onto Kubernetes.
 *
 * The version of the OpenAPI document: 0.0.1
 * Contact: ano@dixa.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import { Configuration } from './configuration';
import globalAxios, { AxiosPromise, AxiosInstance } from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from './common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from './base';

/**
 * 
 * @export
 * @interface ChaosRun
 */
export interface ChaosRun {
    /**
     * 
     * @type {string}
     * @memberof ChaosRun
     */
    runId?: string;
    /**
     * Mode of the deployment to be made
     * @type {string}
     * @memberof ChaosRun
     */
    mode?: ChaosRunModeEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum ChaosRunModeEnum {
    Canary = 'canary',
    Production = 'production'
}

/**
 * 
 * @export
 * @interface InlineResponse200
 */
export interface InlineResponse200 {
    /**
     * 
     * @type {string}
     * @memberof InlineResponse200
     */
    result?: string;
    /**
     * 
     * @type {string}
     * @memberof InlineResponse200
     */
    runId?: string;
    /**
     * 
     * @type {string}
     * @memberof InlineResponse200
     */
    namespace?: string;
}

/**
 * DefaultApi - axios parameter creator
 * @export
 */
export const DefaultApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Deploy a Chaos Test per its specification.
         * @param {ChaosRun} chaosRun Specification for the Chaos Test to be deployed
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deployChaosTest: async (chaosRun: ChaosRun, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'chaosRun' is not null or undefined
            assertParamExists('deployChaosTest', 'chaosRun', chaosRun)
            const localVarPath = `/deploy/chaosTest`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(chaosRun, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Redeploys all services to their latest image.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        redeployAll: async (options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/redeployAll`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * DefaultApi - functional programming interface
 * @export
 */
export const DefaultApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = DefaultApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Deploy a Chaos Test per its specification.
         * @param {ChaosRun} chaosRun Specification for the Chaos Test to be deployed
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deployChaosTest(chaosRun: ChaosRun, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse200>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deployChaosTest(chaosRun, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Redeploys all services to their latest image.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async redeployAll(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.redeployAll(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * DefaultApi - factory interface
 * @export
 */
export const DefaultApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = DefaultApiFp(configuration)
    return {
        /**
         * 
         * @summary Deploy a Chaos Test per its specification.
         * @param {ChaosRun} chaosRun Specification for the Chaos Test to be deployed
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deployChaosTest(chaosRun: ChaosRun, options?: any): AxiosPromise<InlineResponse200> {
            return localVarFp.deployChaosTest(chaosRun, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Redeploys all services to their latest image.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        redeployAll(options?: any): AxiosPromise<void> {
            return localVarFp.redeployAll(options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * DefaultApi - object-oriented interface
 * @export
 * @class DefaultApi
 * @extends {BaseAPI}
 */
export class DefaultApi extends BaseAPI {
    /**
     * 
     * @summary Deploy a Chaos Test per its specification.
     * @param {ChaosRun} chaosRun Specification for the Chaos Test to be deployed
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    public deployChaosTest(chaosRun: ChaosRun, options?: any) {
        return DefaultApiFp(this.configuration).deployChaosTest(chaosRun, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Redeploys all services to their latest image.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    public redeployAll(options?: any) {
        return DefaultApiFp(this.configuration).redeployAll(options).then((request) => request(this.axios, this.basePath));
    }
}


