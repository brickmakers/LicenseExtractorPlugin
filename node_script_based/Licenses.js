import React from 'react'
import PropTypes from 'prop-types'
import licensesJson from '#data/licenses.json'

const LicenseInfo = ({
  name,
  version,
  author,
  license,
  licenseText,
}) => (
  <div className="license">
    <div className="license__first-row">
      <span className="license__name">{name}</span>
      <span className="license__version">{`@${version}`}</span>
      <span className="license__author">{`(${author})`}</span>
    </div>
    <div className="license__license">{`Lizenz: ${license}`}</div>
    <div className="license__text">{licenseText}</div>
  </div>
)

LicenseInfo.propTypes = {
  name: PropTypes.string,
  version: PropTypes.string,
  author: PropTypes.string,
  license: PropTypes.string,
  licenseText: PropTypes.string,
}

const Licenses = () => (
  <div className="licenses">
    {licensesJson.map(info => (<LicenseInfo key={info.name + info.version} {...info} />))}
  </div>
)


export default Licenses
