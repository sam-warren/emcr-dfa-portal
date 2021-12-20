﻿// -------------------------------------------------------------------------
//  Copyright © 2021 Province of British Columbia
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  https://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// -------------------------------------------------------------------------

using System.Linq;
using System.Net.Http.Headers;
using EMBC.Utilities.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.OData.Client;
using Microsoft.OData.Extensions.Client;

namespace EMBC.ESS.Utilities.Dynamics
{
    public static class Configuration
    {
        public static IServiceCollection AddDynamics(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<DynamicsOptions>(opts => configuration.GetSection("Dynamics").Bind(opts));

            services
                .AddHttpClient("adfs_token")
                .AddCircuitBreaker((sp, e) =>
                {
                    var logger = sp.GetRequiredService<ILogger>();
                    logger.LogError(e, "adfs_token break");
                }, sp =>
                {
                    var logger = sp.GetRequiredService<ILogger>();
                    logger.LogInformation("adfs_token reset");
                });

            services.AddTransient<ISecurityTokenProvider, CachedADFSSecurityTokenProvider>();

            services
                .AddODataClient("dynamics")
                .ConfigureODataClient(client =>
                {
                    client.SaveChangesDefaultOptions = SaveChangesOptions.BatchWithSingleChangeset;
                    client.EntityParameterSendOption = EntityParameterSendOption.SendOnlySetProperties;
                    client.Configurations.RequestPipeline.OnEntryStarting((arg) =>
                    {
                        // do not send reference properties and null values to Dynamics
                        arg.Entry.Properties = arg.Entry.Properties.Where((prop) => !prop.Name.StartsWith('_') && prop.Value != null);
                    });
                })
                .AddHttpClient()
                .ConfigureHttpClient((sp, c) =>
                {
                    var options = sp.GetRequiredService<IOptions<DynamicsOptions>>().Value;
                    var tokenProvider = sp.GetRequiredService<ISecurityTokenProvider>();
                    c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenProvider.AcquireToken().GetAwaiter().GetResult());
                })
                .AddCircuitBreaker((sp, e) =>
                {
                    var logger = sp.GetRequiredService<ILogger>();
                    logger.LogError(e, "dynamics break");
                }, sp =>
                {
                    var logger = sp.GetRequiredService<ILogger>();
                    logger.LogInformation("dynamics reset");
                });

            services.AddTransient<IEssContextFactory, EssContextFactory>();
            services.AddTransient(sp => sp.GetRequiredService<IEssContextFactory>().Create());

            return services;
        }
    }
}