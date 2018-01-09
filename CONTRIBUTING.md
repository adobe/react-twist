# Contributing

Thanks for choosing to contribute!

The following are a set of guidelines to follow when contributing to this project.

## Code Of Conduct

This project adheres to the Adobe [code of conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to Grp-opensourceoffice@adobe.com.

## Contributor License Agreement

All third-party contributions to this project must be accompanied by a signed contributor license. This gives Adobe permission to redistribute your contributions as part of the project. A CLA process is coming soon!

<!-- Sign our CLA at [SOME LINK](no link yet). You only need to submit an Adobe CLA one time, so if you have submitted one previously, you are probably good to go! -->

## Code Reviews

All submissions should come in the form of pull requests and need to be reviewed by project committers. Read [GitHub's pull request documentation](https://help.github.com/articles/about-pull-requests/) for more information on sending pull requests.

Lastly, please follow the [pull request template](PULL_REQUEST_TEMPLATE.md) when submitting a pull request!

### Submitting Issues and PRs

In order to simplify our release workflow, we use [conventional-changelog](https://www.npmjs.com/package/conventional-changelog) using the [eslint preset](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-eslint/convention.md).  As such, your PRs should follow this form:

* Supply a prefix indicating the type of change -- one of the following:
    * `Fix:` if the change fixes a bug
    * `Update:` if the change updates a feature (but doesn't break it)
    * `Breaking:` if the change is a breaking change
    * `New:` if the change implements a new feature
    * There are other prefixes you can use; refer to the above preset for more.
* After the prefix, supply a short _but descriptive_ message.
* If there is a related issue number, you can specify it at the end of the message inside parentheses, like so:
    * `(fixes #215)`: for bug fixes
    * `(refs #215)`: doesn't fix the issue (perhaps part of a larger fix)

Some good examples:

```text
Breaking: `ObservableArray` methods that used to return arrays will now return wrapped arrays. (refs #109)
New: Added support for the `<elseif>` tag
Update: Improved the performance of `ObservableArray#map` (refs #219)
Fix: Update filenames to avoid case warnings in Webpack (fixes #232) 
```

## Documentation

Documentation for the core of Twist is contained within [`./docs`](./docs). If you add a new page, please be sure to update the [documentation index](./docs/index.md).

## Template Credits

Inspired by examples at https://github.com/devspace/awesome-github-templates, including:

* https://github.com/appium/appium/blob/master/.github/PULL_REQUEST_TEMPLATE.md (PR)
* https://github.com/angular-translate/angular-translate/blob/master/.github/ISSUE_TEMPLATE.md (Issues)
* https://github.com/appium/appium/blob/master/.github/ISSUE_TEMPLATE.md (Issues)
* https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin/blob/master/issue_template.md (Issues)
* https://github.com/Urigo/angular-meteor/blob/master/.github/ISSUE_TEMPLATE.md (Issues)
