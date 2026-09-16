import semver from 'semver';

// example link: https://docs.redhat.com/en/documentation/openshift_container_platform/4.16/html/release_notes/ocp-4-16-release-notes
const getReleaseNotesLink = (version: string | undefined): string | null => {
  const parsed = semver.coerce(version);

  if (!parsed) {
    return null;
  }

  // semver.coerce() always strips any prerelease/build metadata (e.g. "-beta.1"), so
  // `parsed.prerelease` is unconditionally `[]` here — there is no prerelease guard to apply.
  const { major, minor, patch } = parsed;

  const pageURL = `https://docs.redhat.com/en/documentation/openshift_container_platform/${major}.${minor}/html/release_notes/ocp-${major}-${minor}-release-notes`;
  const patchAnchor = `#ocp-${major}-${minor}-${patch}`;

  if (patch > 0) {
    return pageURL + patchAnchor;
  }

  return pageURL;
};

export default getReleaseNotesLink;
