const PrivacyPolicyPage = () => {
  return (
    <div className="mx-auto flex w-full max-w-3xl grow flex-col gap-4 py-5 leading-7">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: November 26, 2026</p>
      </header>

      <p>
        This policy describes how Fedun.Site, operated by Fedun from Ukraine, handles information
        when you use the website and its tools. We aim to collect only the information needed to
        operate and protect these services. For privacy questions or requests, contact{" "}
        <a className="underline" href="mailto:roman.fedunn@gmail.com">
          roman.fedunn@gmail.com
        </a>
        .
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Information processed by the services</h2>

        <h3 className="font-semibold">Website visits and technical data</h3>
        <p>
          Our hosting and infrastructure providers may process connection and diagnostic
          information, such as IP address, browser details, requested pages, and request time, to
          deliver the site, maintain security, and troubleshoot problems. The exact logs and their
          retention depend on the providers we use.
        </p>

        <h3 className="font-semibold">Accounts and sign-in</h3>
        <p>
          Some features support email-and-password sign-in, Google sign-in, or anonymous accounts.
          Depending on how you sign in, we store account details such as your name, email address,
          profile image, authentication identifiers, and related account records. Authentication
          session records include the session expiry time and may include the IP address and
          user-agent received with the sign-in request.
        </p>
        <p>
          Google Identity Services is loaded to support Google sign-in. Google may receive
          connection information when your browser loads that service and processes information
          when you choose Google sign-in. See{" "}
          <a
            className="underline"
            href="https://policies.google.com/privacy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Google&apos;s Privacy Policy
          </a>{" "}
          for details.
        </p>

        <h3 className="font-semibold">Telegram chat analyzer</h3>
        <p>
          The analyzer reads the Telegram export file in your browser. The file and chat contents
          are not uploaded to or stored in our application server or database for analysis. This
          does not cover technical request information processed by website infrastructure when
          you visit the site.
        </p>

        <h3 className="font-semibold">URL shortener</h3>
        <p>
          To create and redirect a short link, we store the original destination URL, its short
          code, the account that created it, and its creation time.
        </p>
        <p>
          Viewing statistics are off by default. If the link creator turns them on, our server uses
          a visitor&apos;s IP address to estimate their country. We store the visit count, the most
          recent access time, and aggregate counts by country with the link. Raw click IP addresses
          are not stored in the link&apos;s statistics. When statistics are off, the application
          does not perform this IP-based country lookup or record link statistics. Hosting or
          account-security logs are separate.
        </p>

        <h3 className="font-semibold">Telegram sticker sets and bot</h3>
        <p>
          If you connect a Telegram account or use the sticker editor, the service processes
          account-linking details and Telegram user and sticker-set information, such as user IDs,
          usernames, pack identifiers, sticker metadata, and files needed to display or manage
          sticker sets. Some related records are held in a separate database used by the sticker
          service.
        </p>
        <p>
          When you add a sticker or upload a thumbnail, the file is sent to our application server
          and then to Telegram to apply the change. Image resizing and most conversions happen in
          your browser. For some WEBM thumbnails, our server may encode a resized image frame or
          an existing sticker video with FFmpeg, for example when browser encoding is unavailable
          or does not meet Telegram&apos;s size limit. The server-side encoder uses temporary files
          and removes them after processing; uploaded files are not stored as separate records in
          our application database.
        </p>
        <p>
          The sticker editor sends requests from our server to the Telegram Bot API to retrieve
          sticker sets and files or apply changes such as reordering stickers. Telegram processes
          those requests under its own privacy terms. Interactions with the Telegram bot may also
          be subject to Telegram&apos;s and the bot operator&apos;s privacy practices. Unlinking a
          Telegram account clears its association with your web account, but does not delete the
          related record from the separate sticker-service database or remove records held by
          Telegram.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Cookies and local storage</h2>
        <p>
          Authentication uses cookies needed to maintain sign-in sessions. The site also uses
          browser local storage to remember your theme preference. Google Identity Services may use
          its own technologies when loaded or used for sign-in; refer to Google&apos;s privacy
          information for details.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How information is used and shared</h2>
        <p>
          We use information to provide the requested features, maintain accounts and links,
          display link statistics when enabled, operate the sticker editor, and protect and
          troubleshoot the site. We do not sell personal information.
        </p>
        <p>Information may be processed by:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Hosting and database providers that support the website and its features.</li>
          <li>Google, when its identity service is loaded or used for sign-in.</li>
          <li>Telegram, when the sticker service communicates with Telegram&apos;s Bot API.</li>
          <li>Public authorities, when disclosure is required by applicable law.</li>
        </ul>
        <p>
          These providers may process information in countries other than the country where you
          live. Their own privacy terms may also apply to information they process.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Retention and your choices</h2>
        <p>
          Short links and their associated statistics remain until the link or its associated
          account is deleted. Authentication session records have an expiry time. Other account
          and sticker-service records are kept for as long as needed to provide and protect the
          relevant features, or as required by law.
        </p>
        <p>
          You can delete your short links from your dashboard and unlink your Telegram account
          through the sticker service. Unlinking is not the same as deleting all Telegram or
          sticker-service records. Depending on where you live, you may also have rights to request
          access to, correction of, or deletion of personal information. Contact us at{" "}
          <a className="underline" href="mailto:roman.fedunn@gmail.com">
            roman.fedunn@gmail.com
          </a>{" "}
          to make a request.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Third-party links</h2>
        <p>
          The site may link to third-party services, including Telegram. Those services have their
          own privacy practices, which we do not control.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Changes and contact</h2>
        <p>
          We may update this policy as the services or their data practices change. The updated
          date at the top of this page shows when the policy was last revised. If you have a
          question or privacy request, contact{" "}
          <a className="underline" href="mailto:roman.fedunn@gmail.com">
            roman.fedunn@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
