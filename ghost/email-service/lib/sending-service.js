/**
 * @typedef {object} EmailData
 * @prop {string} html
 * @prop {string} plaintext
 * @prop {string} subject
 * @prop {string} from
 * @prop {string} [replyTo]
 * @prop {Recipient[]} recipients
 * 
 * @typedef {object} IEmailProviderService
 * @prop {(emailData: EmailData, options: EmailSendingOptions) => Promise<EmailProviderSuccessResponse>} send
 * 
 * @typedef {object} Post
 * @typedef {object} Newsletter
 */

/**
 * @typedef {import("./email-renderer")} EmailRenderer
 */

/**
 * @typedef {object} EmailSendingOptions
 * @prop {boolean} clickTrackingEnabled
 * @prop {boolean} openTrackingEnabled
 */

/**
 * @typedef {import("./email-renderer").MemberLike} MemberLike
 */

/**
 * @typedef {object} Recipient
 * @prop {string} email
 * @prop {Replacement[]} replacements
 */

/**
 * @typedef {object} Replacement
 * @prop {string} token
 * @prop {string} value
 */

/**
 * @typedef {object} EmailProviderSuccessResponse
 * @prop {string} id
 */

class SendingService {
    #emailProvider;
    #emailRenderer;

    /**
     * @param {object} dependencies
     * @param {IEmailProviderService} dependencies.emailProvider
     * @param {EmailRenderer} dependencies.emailRenderer
     */
    constructor({
        emailProvider,
        emailRenderer
    }) {
        this.#emailProvider = emailProvider;
        this.#emailRenderer = emailRenderer;
    }

    /** 
     * Send a given post, rendered for a given newsletter and segment to the members provided in the list
     * @param {object} data
     * @param {Post} data.post
     * @param {Newsletter} data.newsletter
     * @param {string|null} data.segment
     * @param {MemberLike[]} data.members
     * @param {EmailSendingOptions} options
     * @returns {Promise<EmailProviderSuccessResponse>}
    */
    async send({post, newsletter, segment, members}, options) {
        const emailBody = await this.#emailRenderer.renderBody(
            post, 
            newsletter, 
            segment,
            options
        );

        const recipients = this.buildRecipients(members, emailBody.replacements);
        return await this.#emailProvider.send({
            subject: this.#emailRenderer.getSubject(post, newsletter),
            from: this.#emailRenderer.getFromAddress(post, newsletter),
            replyTo: this.#emailRenderer.getReplyToAddress(post, newsletter) ?? undefined,
            html: emailBody.html,
            plaintext: emailBody.plaintext,
            recipients
        }, options);
    }
    
    /**
     * @private
     * @param {MemberLike[]} members
     * @param {import("./email-renderer").ReplacementDefinition[]} replacementDefinitions
     * @returns {Recipient[]}
     */
    buildRecipients(members, replacementDefinitions) {
        return members.map((member) => {
            return {
                email: member.email,
                replacements: replacementDefinitions.map((def) => {
                    return {
                        token: def.token,
                        value: def.getValue(member)
                    };
                })
            };
        });
    }
}

module.exports = SendingService;
