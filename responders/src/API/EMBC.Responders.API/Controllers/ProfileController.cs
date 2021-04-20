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

using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using EMBC.ESS.Shared.Contracts.Profile;
using EMBC.ESS.Shared.Contracts.Team;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace EMBC.Responders.API.Controllers
{
    /// <summary>
    /// Handle user profile requests
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly IMessagingClient messagingClient;
        private readonly IMapper mapper;
        private readonly ILogger<ProfileController> logger;

        public ProfileController(IMessagingClient messagingClient, IMapper mapper, ILogger<ProfileController> logger)
        {
            this.messagingClient = messagingClient;
            this.mapper = mapper;
            this.logger = logger;
        }

        /// <summary>
        /// Get the current logged in user profile
        /// </summary>
        /// <returns>current user profile</returns>
        [HttpGet("current")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<UserProfile>> GetCurrentUserProfile()
        {
            var memberId = User.FindFirstValue(ClaimTypes.Sid);
            var teamId = User.FindFirstValue("user_team");

            // Get the current user
            var reply = await messagingClient.Send(new TeamMembersQueryCommand { TeamId = teamId, MemberId = memberId, IncludeActiveUsersOnly = true });
            var currentMember = reply.TeamMembers.SingleOrDefault();

            currentMember.LastSuccessfulLogin = DateTime.Now;

            // Update current user
            await messagingClient.Send(new SaveTeamMemberCommand
            {
                Member = mapper.Map<ESS.Shared.Contracts.Team.TeamMember>(currentMember)
            });

            return Ok(mapper.Map<UserProfile>(currentMember));
        }

        /// <summary>
        /// Update the current user's profile
        /// </summary>
        /// <param name="request">The profile information</param>
        /// <returns>profile id</returns>
        [HttpPost("current")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult> Update(UpdateUserProfileRequest request)
        {
            var memberId = User.FindFirstValue(ClaimTypes.Sid);
            var teamId = User.FindFirstValue("user_team");

            // Get the current user
            var reply = await messagingClient.Send(new TeamMembersQueryCommand { TeamId = teamId, MemberId = memberId, IncludeActiveUsersOnly = false });
            var currentMember = reply.TeamMembers.SingleOrDefault();

            // Set the updateable fields
            currentMember.FirstName = request.FirstName;
            currentMember.LastName = request.LastName;
            currentMember.Email = request.Email;
            currentMember.Phone = request.Phone;

            // Update current user
            await messagingClient.Send(new SaveTeamMemberCommand
            {
                Member = mapper.Map<ESS.Shared.Contracts.Team.TeamMember>(currentMember)
            });

            return Ok(new { Id = memberId });
        }

        /// <summary>
        /// Current user read and signed the electronic agreement
        /// </summary>
        /// <returns>Ok when successful</returns>
        [HttpPost("agreement")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> SignAgreement()
        {
            var memberId = User.FindFirstValue(ClaimTypes.Sid);
            var teamId = User.FindFirstValue("user_team");

            // Get the current user
            var reply = await messagingClient.Send(new TeamMembersQueryCommand { TeamId = teamId, MemberId = memberId, IncludeActiveUsersOnly = true });
            var currentMember = reply.TeamMembers.SingleOrDefault();

            // Set the Agreement Sign Date
            currentMember.AgreementSignDate = DateTime.Now;

            // Update current user
            await messagingClient.Send(new SaveTeamMemberCommand
            {
                Member = mapper.Map<ESS.Shared.Contracts.Team.TeamMember>(currentMember)
            });

            return Ok();
        }
    }

    public class UserProfile
    {
        public string Id { get; set; }
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string TeamId { get; set; }
        public string TeamName { get; set; }
        public string Role { get; set; }
        public bool RequiredToSignAgreement { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }

    public class UpdateUserProfileRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }

    public class SecurityMapping : Profile
    {
        public SecurityMapping()
        {
            CreateMap<EMBC.ESS.Shared.Contracts.Team.TeamMember, UserProfile>()
                .ForMember(d => d.LastLoginDate, opts => opts.MapFrom(s => s.LastSuccessfulLogin))
                .ForMember(d => d.RequiredToSignAgreement, opts => opts.MapFrom(s => !s.AgreementSignDate.HasValue));
        }
    }
}
