import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl'
import { KTSVG } from '../../../../_metronic/helpers'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { useAlert, useLoadingOverlay } from '../../../modules/sgl-utils/DialogsProvider'
import axios from 'axios'
import { useAppSelector } from '../../../redux/hooks'

function TeamsSetupDialog(props) {
  const intl = useIntl()
  const loadingOverlay = useLoadingOverlay()
  const methods = useFormContext()
  const [showPopup1, setShowPopup1] = useState(false)
  const [teamBasedOn, setTeamBasedOn] = useState('country')
  const [grid1Data, setGrid1Data] = useState([])
  const grid2DataInitial = methods.getValues('individual_trips')
  const grid3DataInitial = methods.getValues('team_trips')
  const [grid2Data, setGrid2Data] = useState([])
  const [grid3Data, setGrid3Data] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [selectedType, setSelectedType] = useState(
    teamBasedOn === 'country' ? 'Country' : 'Organization'
  )
  const typeRef = useRef(null)
  const [selectedRow, setSelectedRow] = useState() // for double click
  const [selectedRows, setSelectedRows] = useState([]) // for button add
  const [selectedDropdownOption, setSelectedDropdownOption] = useState(null)
  const [selectedDropdownOptionId, setSelectedDropdownOptionId] = useState(null)
  const [grid3Api, setGrid3Api] = useState(null)
  const [grid2Api, setGrid2Api] = useState(null)
  const alertDialog = useAlert()
  const [selectedGrid1Row, setSelectedGrid1Row] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCountryLabel, setSelectedCountryLabel] = useState('')
  const [grid1Api, setGrid1Api] = useState(null)
  const [addedData, setAddedData] = useState([]) // for newly added rows
  const [editedData, setEditedData] = useState([]) // for edited rows
  const [deletedData, setDeletedData] = useState([]) // for deleted rows
  const customer_id = useAppSelector((state) => state.showCompany.company_id)
  const [teamName, setTeamName] = useState('')
  const [teamNameError, setTeamNameError] = useState(null)
  const [selectedCountryError, setSelectedCountryError] = useState(null)
  const [abbreviation, setAbbreviation] = useState('')
  const [abbreviationError, setAbbreviationError] = useState(null)
  const [grid1ApiColumns, setGrid1ApiColumns] = useState(null)
  const [grid2ApiColumns, setGrid2ApiColumns] = useState(null)
  const [orgCountry, setOrgCountry] = useState('')
  const [orgCountryLabel, setOrgCountryLabel] = useState('')
  const [typedValue, setTypedValue] = useState('')
  const [notSaved, setNotSaved] = useState(true)
  const [isModified, setIsModified] = useState(false)
  const [previousGrid2Data, setPreviousGrid2Data] = useState([])
  const [previousGrid3Data, setPreviousGrid3Data] = useState([])
  const [orgData, setOrgData] = useState([])
  const [countryData, setCountryData] = useState([])
  const [selectedDropdownOptionAbbr, setSelectedDropdownOptionAbbr] = useState(null)

  const columnDefsTeams = [
    {
      field: 'team_name',
      flex: 1,
      headerName: intl.formatMessage({ id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.TEAMS.LABEL.TEAM' }),
      sortable: true
    },
    {
      field: 'team_abbr',
      minWidth: 80,
      maxWidth: 80,
      headerName: intl.formatMessage({ id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.TEAMS.LABEL.ABBR' }),
    },
    {
      field: '',
      minWidth: 80,
      maxWidth: 80,
      headerName: intl.formatMessage({ id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.TEAMS.LABEL.EDIT' }),
      cellRenderer: function (params) {
        const rowData = params.data
        const rowIndex = params.rowIndex
        return (
          <a
            style={{ color: '#2274a5', cursor: 'pointer' }}
            onClick={() => handlePopup1Open(rowIndex)}
            className='btn-link'
          >
            {' '}
            {intl.formatMessage({ id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.TEAMS.LABEL.EDIT' })}{' '}
          </a>
        )
      },
    },
  ]

  const columnDefsIndividualTrips = [
    {
      field: 'number',
      minWidth: 80,
      maxWidth: 80,
      headerName: intl.formatMessage({
        id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.INDIVIDUAL.TRIPS.LABEL.ENTRY',
      }),
    },
    {
      field: 'rider_name',
      flex: 1,
      headerName: intl.formatMessage({
        id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.INDIVIDUAL.TRIPS.LABEL.RIDER',
      }),
    },
    {
      field: 'country_code',
      headerName: intl.formatMessage({
        id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.INDIVIDUAL.TRIPS.LABEL.COUNTRY',
      }),
    },
  ]

  const columnDefsTeamTrips = [
    {
      field: 'team_id',
      rowGroup: true,
      hide: true,
    },
    {
      field: 'team_name',
      flex: 1,
      headerName: intl.formatMessage({ id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.TEAMS.LABEL.TEAM' }),
      cellStyle: { textAlign: 'center' },
      cellRenderer: (params) => {
        if (params?.data?.number == undefined && params?.data?.number == null) {
          // If the number value is present, hide the team_name cell value
          return params.value
        }
        return null
      },
      sortable: true,
      comparator: (valueA, valueB, nodeA, nodeB, isInverted) => {
        const teamNameA = nodeA?.key?.toUpperCase();
        const teamNameB = nodeB?.key?.toUpperCase();
        if (teamNameA < teamNameB) {
          return -1;
        }
        if (teamNameA > teamNameB) {
          return 1;
        }
        return 0;
      },
    },
    {
      field: 'number',
      minWidth: 80,
      maxWidth: 80,
      headerName: intl.formatMessage({
        id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.INDIVIDUAL.TRIPS.LABEL.ENTRY',
      }),
    },
    {
      field: 'rider_name',
      flex: 1,
      headerName: intl.formatMessage({
        id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.INDIVIDUAL.TRIPS.LABEL.RIDER',
      }),
    },
    {
      field: 'country_code',
      cellStyle: { textAlign: 'center' },
      headerName: intl.formatMessage({
        id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.INDIVIDUAL.TRIPS.LABEL.COUNTRY',
      }),
    },
    {
      maxWidth: 50,
      cellRenderer: (params) => {
        return deleteRenderer(params)
      },
    },
  ]

  const containerStyleTeams = useMemo(() => ({ width: '100%', height: '150px' }), [])
  const defaultColDef = useMemo(() => {
    return {
      minWidth: 110,
      width: 110,
      resizable: true,
      sortable: false,
      suppressMenu: true,
      suppressMovable: true,
      cellStyle: function (params) {
        if (typeof params.value === 'number') {
          return { textAlign: 'center' }
        } else {
          return { textAlign: 'left' }
        }
      },
      wrapHeaderText: true,
      autoHeaderHeight: true,
      headerClass: 'ag-center-aligned-header',
    }
  }, [])

  useEffect(() => {
    if (grid3DataInitial) {
      setGrid3Data(grid3DataInitial)
    }
    setGrid2Data(grid2DataInitial)
  }, [grid2DataInitial, grid3DataInitial])

  useEffect(() => {
    updateGrid1Data()
  }, [])

  const handleInputChange = (event) => {
    const value = event.target.value
    setTypedValue(value)
  }

  const handleTeamNameChange = (event) => {
    setTeamName(event.target.value)
    setTeamNameError(null)
  }

  const handleAbbreviationChange = (event) => {
    setAbbreviation(event.target.value)
    setAbbreviationError(null)
  }

  const handleCountrySelect = (country) => {
    setSelectedCountry(country.value)
    setSelectedCountryLabel(country.label)
    setSelectedCountryError(null)
  }

  const handleOrgCountrySelect = (country) => {
    setOrgCountry(country.value)
    setOrgCountryLabel(country.label)
  }

  const updateGrid1Data = () => {
    axios
      .get(process.env.REACT_APP_NEST_API_URL + `/classes/teams?customer_id=${customer_id}`)
      .then((response) => {
        setCountryData(response.data.country_teams)
        setOrgData(response.data.organization_teams)
      })
  }

  useEffect(() => {
    if (teamBasedOn === 'country') {
      setGrid1Data(countryData)
    } else if (teamBasedOn === 'organization') {
      setGrid1Data(orgData)
    }
  }, [countryData, orgData, teamBasedOn])

  const rowDragText = (params) => {
    return params?.rowNode?.allLeafChildren[0]?.data?.team_name
  };

  const teamRowDragText = (params) => {
    return params?.rowNode?.data?.team_name
  };

  const tripRowDragText = (params) => {
    return `${params?.rowNode?.data?.rider_name} (#${params?.rowNode?.data?.number})`
  };

  const groupRowRendererParams = useMemo(() => {
    return {
      rowDrag: true,
      suppressCount: true,
      innerRenderer: (params) => {
        const teamId = params.node.key // get the team name from the node key
        let team = grid1Data.find((item) => item.team_id === Number(teamId))
        if (!team) {
          team = grid3Data.find((item) => item.team_id === Number(teamId))
          if (!team) {
            team = grid3DataInitial.find((item) => item.team_id === Number(teamId))
          }
        }
        const teamName = team ? team.team_name : ''
        const teamAbbr = team ? team.team_abbr : ''

        if (params.node.field === 'team_id') {
          return (
            <div>
              <strong>{teamName}</strong> ({teamAbbr})
            </div>
          )
        }
      },
      suppressDoubleClickExpand: true,
      suppressEnterExpand: true,
    }
  }, [grid1Data, grid3DataInitial])

  const handlePopup1Open = (rowIndex) => {
    setShowPopup1(true)
    setTeamNameError(null)
    setSelectedCountryError(null)
    setAbbreviationError(null)
    setSelectedType(teamBasedOn === 'organization' ? 'Organization' : 'Country')
    // for new team
    if (rowIndex >= 0) {
      setEditingIndex(rowIndex)
      setTeamName(grid1Data[rowIndex]?.team_name)
      setAbbreviation(grid1Data[rowIndex]?.team_abbr)
      const rowData = grid1Data[rowIndex]
      if (rowData.team_abbr) {
        const countryMatch = props.form_meta.countries.find(
          (country) => country.value === rowData.team_abbr
        )
        if (countryMatch && selectedType == 'Country') {
          setSelectedCountry(countryMatch.value)
          setSelectedCountryLabel(countryMatch.label)
        }
      }
      if (rowData.countryfororganization) {
        const countryMatch = props.form_meta.countries.find(
          (country) => country.label === rowData.countryfororganization
        )
        if (countryMatch && selectedType == 'Organization') {
          setOrgCountry(countryMatch.value)
          setOrgCountryLabel(countryMatch.label)
        }
      }
    } else {
      setEditingIndex(null)
      setSelectedCountry('USA')
      setSelectedCountryLabel('United States')
      setOrgCountry('USA')
      setOrgCountryLabel('United States')
    }
  }

  const handleCheckboxChange = (event) => {
    const value = event.target.value
    setTeamBasedOn(value)
    setSelectedType(value === 'organization' ? 'Organization' : 'Country')
  }

  const deleteRenderer = (props) => {
    return (
      <i
        className='far fa-trash-alt'
        style={{ cursor: 'pointer' }}
        onClick={() => handleRemoveRows()}
      ></i>
    )
  }

  const onGridOneRowDoubleClicked = (event) => {
    // Get the selected row data
    const selectedRowData = event.data

    // Check if the selected row data already exists in the state array
    const isRowAlreadySelected = selectedRows.some((row) => row.number === selectedRowData.number)

    // If the selected row data is not already in the state array, add it
    if (!isRowAlreadySelected) {
      setSelectedRows((prevState) => [...prevState, selectedRowData])
      setTypedValue((prevValue) => prevValue + (prevValue ? ', ' : '') + selectedRowData.number)
    }
  }

  const handleAddEntriesToTeamTrips = () => {
    // Check if user has selected a team from the dropdown
    if (selectedRows.length == 0 && typedValue == '') {
      alertDialog({ message: 'Please add any Entry number.' })
      return
    }

    // Check if user has selected a team from the dropdown
    if (!selectedDropdownOption) {
      alertDialog({ message: 'Please select a team first.' })
      return
    }

    // Check if any selectedRows are already present in grid3Data
    const selectedRowsAlreadyExist = selectedRows.some((selectedRow) =>
      grid3Data.some((grid3Row) => grid3Row.number === selectedRow.number)
    )

    if (selectedRowsAlreadyExist) {
      alertDialog({
        message: 'One or more selected Entry numbers are already associated with a team.',
      })
      return
    }

    setIsModified(true)
    setPreviousGrid2Data(grid2Data)
    setPreviousGrid3Data(grid3Data)

    const rowsToBeAdded = []
    if (typedValue !== '') {
      // Split typed input value by commas
      const entryNumbers = typedValue.split(',')

      // Validate each entry number
      entryNumbers.forEach((entryNumber) => {
        // Trim leading and trailing spaces
        const trimmedEntryNumber = entryNumber.trim()

        // Check if the trimmed entry number is valid
        if (/[^0-9]/.test(trimmedEntryNumber)) {
          alertDialog({ message: 'Please enter valid entry number.' })
          return
        }

        // Convert entry number to a number
        const numericEntryNumber = Number(trimmedEntryNumber)

        // Find the corresponding entry in grid2Data
        const typedEntry = grid2Data.find((row) => row.number === numericEntryNumber)

        if (typedEntry) {
          const newEntry = {
            team_id: selectedDropdownOptionId,
            team_name: selectedDropdownOption,
            team_abbr: selectedDropdownOptionAbbr,
            entry_id: typedEntry.entry_id,
            number: typedEntry.number,
            rider_name: typedEntry.rider_name,
            country_code: typedEntry?.country_code,
          }

          // Add the new entry to rowsToBeAdded
          rowsToBeAdded.push(newEntry)
        } else {
          alertDialog({ message: 'Please enter valid entry number.' })
          return
        }
      })
    }

    // If a typed value was entered, remove all matching rows
    let newGrid2Data = [...grid2Data] // initialize to current grid2Data state value
    if (typedValue !== '') {
      const typedEntryNumbers = typedValue
        .split(',')
        .map((entryNumber) => Number(entryNumber.trim()))

      typedEntryNumbers.forEach((typedEntryNumber) => {
        newGrid2Data = newGrid2Data.filter((row) => row.number !== typedEntryNumber)
      })
    }

    // Update the state variable for grid2Data
    setGrid2Data(newGrid2Data)

    // Find the index of the selected dropdown option
    const selectedIndex = grid3Data.findIndex((row) => row.team_id === selectedDropdownOptionId)

    const rowsToBeAddedFiltered = rowsToBeAdded.filter((newRow, index, arr) => {
      // Check if the new entry already exists in grid3Data or in rowsToBeAdded before the current index
      const existingEntry = grid3Data.find((row) => row?.number === newRow.number)
      const isDuplicate = arr.slice(0, index).some((row) => row.number === newRow.number)

      // If the entry already exists or if it's a duplicate, filter it out
      if (existingEntry || isDuplicate) {
        return false
      }

      // Otherwise, keep it in the filtered array
      return true
    })

    // Insert the rows after the selected dropdown option
    let newGrid3Data

    if (selectedIndex === grid3Data.length - 1) {
      // if selected index is the last index, just append the rows to the end
      newGrid3Data = [...grid3Data, ...rowsToBeAddedFiltered]
    } else {
      // otherwise, insert the rows after the selected index
      newGrid3Data = [
        ...grid3Data.slice(0, selectedIndex + 1),
        ...rowsToBeAddedFiltered,
        ...grid3Data.slice(selectedIndex + 1),
      ]
    }

    // Update the state variable for grid3Data
    setGrid3Data(newGrid3Data)
    setSelectedRows([])
    setEntryNoFieldValue('')
    setTypedValue('')
  }

  const setEntryNoFieldValue = (value) => {
    const entryNoField = document.getElementById('formTextField')
    if (entryNoField) {
      entryNoField.value = value
    }
  }

  const handleSelectTeam = (teamId, teamName, teamAbbr) => {
    setSelectedDropdownOption(teamName)
    setSelectedDropdownOptionAbbr(teamAbbr)
    setSelectedDropdownOptionId(teamId)
  }

  function copyTeamsData(rowData) {
    setSelectedGrid1Row(rowData.data)
  }

  useEffect(() => {
    if (!selectedGrid1Row) {
      return
    }

    // Filter the required field(s) from the selected row data
    const filteredData = {
      team_id: selectedGrid1Row.team_id,
      team_name: selectedGrid1Row.team_name /* + ' (' + selectedGrid1Row.team_abbr + ')'*/,
      team_abbr: selectedGrid1Row.team_abbr,
    }

    // Check if the filtered data already exists in the parallel grid
    const existingRow = grid3Data.find((data) => data.team_id === filteredData.team_id)

    // If the row does not exist, add the filtered data to the selected row state
    if (!existingRow) {
      setSelectedRow(filteredData)
    }

    setSelectedGrid1Row(null)
  }, [selectedGrid1Row])

  //   Add the selected row to grid3Data when it changes
  useEffect(() => {
    if (selectedRow) {
      const existingRow = grid3Data.find((data) => data.team_id === selectedRow.team_id)
      if (!existingRow && Object.keys(selectedRow).length > 0) {
        setGrid3Data((prevData) => [...prevData, selectedRow])
      }
      setSelectedRow(null)
    }
  }, [selectedRow])

  function handleCancel() {
    props.onHide()
    setTeamBasedOn('country')
    if (notSaved) {
      setGrid3Data(grid3DataInitial)
      setGrid2Data(grid2DataInitial)
    } else if (isModified) {
      setGrid3Data(previousGrid3Data)
      setGrid2Data(previousGrid2Data)
    }
    setSelectedRows([])
    setSelectedRow()
    setSelectedDropdownOption(null)
    setSelectedDropdownOptionId(null)
    setSelectedDropdownOptionAbbr(null)
    setAddedData([])
    setDeletedData([])
    setEditedData([])
    setTypedValue('')
    setSelectedGrid1Row(null)
  }

  const handleRemoveRows = () => {
    const selectedNodes = grid3Api.getSelectedNodes()
    const selectedRows = selectedNodes.map((node) => node.data)

    // Check if any of the selected rows have team_name set
    const hasTeamNameSelected = selectedRows.some((row) => row?.team_name)

    // Check if any selected rows have team_id set but number is undefined
    const hasTeamIdSelectedWithoutNumber = selectedRows.some(
      (row) => row?.team_id && row?.number == undefined
    )

    if (hasTeamIdSelectedWithoutNumber) {
      // Check if any other rows in grid3Data have the same team_id
      const hasAssociatedTrips = grid3Data.some((row) => {
        return row?.team_id === selectedRows[0]?.team_id && row?.number !== undefined
      })

      if (hasAssociatedTrips) {
        alertDialog({ message: 'Please delete all the associated entries with this team first' })
        return
      }
    }

    if (hasTeamNameSelected) {
      // Remove selected rows from grid3Data and re-insert them into grid2Data
      const updatedGrid2Data = [...grid2Data]
      const updatedGrid3Data = [...grid3Data]

      selectedRows.forEach((row) => {
        // Remove row from grid3Data
        const indexToRemove = updatedGrid3Data.findIndex((r) => r === row)
        updatedGrid3Data.splice(indexToRemove, 1)

        // Re-insert row into grid2Data if number is defined
        if (row?.number) {
          const newRow = {
            ...row,
            team_id: null,
            team_name: null,
            team_abbr: null,
            rowIndex: updatedGrid2Data.length,
          }
          updatedGrid2Data.push(newRow)
        }

        // Check if the deleted row has the same team_name as the selectedDropdownOption
        if (
          selectedDropdownOptionId &&
          row?.team_id === selectedDropdownOptionId &&
          row?.number == undefined
        ) {
          setSelectedDropdownOption(null)
          setSelectedDropdownOptionId(null)
          setSelectedDropdownOptionAbbr(null)
        }

        if (updatedGrid3Data.length == 0) {
          setSelectedDropdownOption(null)
          setSelectedDropdownOptionId(null)
          setSelectedDropdownOptionAbbr(null)
        }
      })

      // Update state of grid2Data and grid3Data
      setGrid2Data(updatedGrid2Data)
      setGrid3Data(updatedGrid3Data)
    }
  }

  const linkTeamsWithClass = () => {
    const teamEntriesMap = grid3Data.reduce((acc, entry) => {
      if (entry.entry_id) {
        if (!acc.has(entry.team_id)) {
          acc.set(entry.team_id, [entry.entry_id])
        } else {
          acc.get(entry.team_id).push(entry.entry_id)
        }
      }
      return acc
    }, new Map())

    const teamEntriesArray = Array.from(teamEntriesMap, ([teamId, entryIds]) => ({
      team_id: teamId,
      entry_ids: entryIds,
    }))

    methods.setValue('added_team_trips', teamEntriesArray, { shouldDirty: true })

    const deletedTeamTrips = []

    grid3DataInitial.forEach((initialTrip) => {
      const matchingTrip = grid3Data.find(
        (trip) => trip.team_id === initialTrip.team_id && trip.number === initialTrip.number
      )
      if (!matchingTrip) {
        deletedTeamTrips.push({
          team_id: initialTrip.team_id,
          entry_id: initialTrip.entry_id,
        })
      }
    })

    methods.setValue('deleted_team_trips', deletedTeamTrips, { shouldDirty: true })
    setNotSaved(false)
    setIsModified(false)
    props.onHide()
    setTeamBasedOn('country')
    setSelectedRows([])
    setSelectedRow()
    setSelectedDropdownOption(null)
    setSelectedDropdownOptionId(null)
    setSelectedDropdownOptionAbbr(null)
    setSelectedGrid1Row(null)
  }

  useEffect(() => {
    if (grid3Data) {
      const filteredGrid3Data = grid3Data?.filter((entry) => entry?.entry_id && entry?.number)
      setGrid3Data(filteredGrid3Data)
    }
  }, [props.show])

  const saveTeams = (addedData, deletedData, editedData) => {
    // Make an axios request to the backend API to save the changes
    loadingOverlay({ show: true })
    axios
      .post(process.env.REACT_APP_NEST_API_URL + '/classes/teams', {
        customer_id: customer_id,
        addedData: addedData,
        deletedData: deletedData,
        editedData: editedData,
      })
      .then((response) => {
        updateGrid1Data()
        setAddedData([])
        setDeletedData([])
        setEditedData([])
        loadingOverlay({ show: false })
        if (response.data.success == false) {
          alertDialog({ message: response.data.message })
        }
      })
  }

  const handleOkButtonClick = () => {
    if (teamName.trim() === '') {
      setTeamNameError('Please enter a team name.')
    } else if (selectedCountry === '' && selectedType == 'Country') {
      setSelectedCountryError('Please select a country.')
    } else if (abbreviation === '' && selectedType == 'Organization') {
      setAbbreviationError('Please add abbreviation.')
    } else {
      // Handle form submission
      // Create a new row object with the form data
      let newRow
      if (selectedType === 'Country') {
        newRow = {
          team_name: document?.getElementById('formTeamName')?.value,
          type: selectedType,
          team_abbr: selectedCountry,
          countryfororganization: selectedCountryLabel,
        }
      } else {
        newRow = {
          team_name: document?.getElementById('formTeamName')?.value,
          type: selectedType,
          team_abbr: document?.getElementById('formAbbreviation')?.value,
          countryfororganization: orgCountryLabel,
        }
      }

      // If editing an existing row, replace the old row with the new row
      if (editingIndex !== null) {
        const updatedGridData = [...grid1Data]
        const editedRow = {
          team_id: updatedGridData[editingIndex].team_id,
        }
        const updatedFields = Object.keys(newRow).filter(
          (key) => newRow[key] !== updatedGridData[editingIndex][key]
        )
        updatedFields.forEach((key) => (editedRow[key] = newRow[key]))
        updatedGridData[editingIndex] = { ...updatedGridData[editingIndex], ...newRow }
        setGrid1Data(updatedGridData)

        // Check if the edited row already exists in editedData array
        const existingIndex = editedData.findIndex((row) => row.team_id === editedRow.team_id)
        if (existingIndex !== -1) {
          const updatedEditedData = [...editedData]
          if (editedRow.team_id) {
            // add a check for team_id to prevent adding empty rows
            updatedEditedData[existingIndex] = { ...updatedEditedData[existingIndex], ...editedRow }
            setEditedData(updatedEditedData)
          }
        } else {
          if (editedRow.team_id) {
            // add a check for team_id to prevent adding empty rows
            setEditedData([...editedData, editedRow])
          }
        }
      }
      // If adding a new row, add the new row to the beginning of the grid data
      else {
        const newGridData = [newRow, ...grid1Data] // Use unshift() to add newRow to the beginning of the array
        setGrid1Data(newGridData)
        const addedRow = {
          team_id: '',
        }
        Object.keys(newRow).forEach((key) => (addedRow[key] = newRow[key]))
        setAddedData([addedRow, ...addedData])
      }

      // Reset the form fields and hide the Modal
      document.getElementById('formTeamName').value = ''
      if (selectedType === 'Organization') {
        document.getElementById('formAbbreviation').value = ''
      }
      setTeamName('')
      setAbbreviation('')
      setSelectedCountry('USA')
      setSelectedCountryLabel('United States')
      setOrgCountry('USA')
      setOrgCountryLabel('United States')
      setEditingIndex(null)
      setShowPopup1(false)
    }
  }

  useEffect(() => {
    if (addedData.length > 0 || deletedData.length > 0 || editedData.length > 0) {
      saveTeams(addedData, deletedData, editedData)
    }
  }, [addedData, deletedData, editedData])

  const handleRemoveClick = () => {
    const selectedRows = grid1Api.getSelectedRows()
    if (selectedRows.length === 0) {
      alertDialog({ message: 'Please select at least one team to remove' })
      return
    }

    // Check if selected teams have associated entries in grid3Data
    const teamsInGrid3 = new Set(grid3Data.map((row) => row.team_id))

    const hasAssociatedEntries = selectedRows.some((row) => {
      const teamId = row.team_id
      return (
        teamsInGrid3.has(teamId) &&
        grid3Data.some((grid3Row) => grid3Row.team_id === teamId && grid3Row.number)
      )
    })

    if (hasAssociatedEntries) {
      alertDialog({ message: 'Please delete all the associated entries with this team first' })
      return
    }

    // Remove the selected rows from grid3Data
    const updatedGrid3Data = grid3Data.filter((rowData) => {
      // Only remove rows that have the same team_id as selected rows (if any)
      if (selectedRows.some((row) => row.team_id === rowData.team_id)) {
        return false
      }
      return true
    })
    setGrid3Data(updatedGrid3Data)

    // Remove each selected row from the grid data
    const updatedGrid1Data = grid1Data.filter((rowData) => !selectedRows.includes(rowData))
    setGrid1Data(updatedGrid1Data)

    // Add the removed rows to the deletedData array
    const deletedRows = selectedRows.map((row) => ({ team_id: row.team_id }))
    setDeletedData([...deletedData, ...deletedRows])

    // Clear selected dropdown option if deleted row has the same team name
    const deletedTeamNames = selectedRows.map((row) => row.team_name)
    if (
      selectedDropdownOption != null &&
      deletedTeamNames.includes(selectedDropdownOption) &&
      selectedDropdownOptionAbbr != null
    ) {
      setSelectedDropdownOption(null)
      setSelectedDropdownOptionId(null)
      setSelectedDropdownOptionAbbr(null)
    }

    // Apply the row removal transaction to the grid
    const transaction = selectedRows.map((row) => ({ remove: row }))
    grid1Api.applyTransaction(transaction)
  }

  // Call the saveTeams function on save button click
  const handleSaveClick = () => {
    // saveTeams(addedData, deletedData, editedData)
    linkTeamsWithClass()
  }

  const getRowId = (params) => {
    if (params?.data?.team_id && params?.data?.number) {
      return `${params?.data?.team_id}_${params?.data?.team_name}_${params?.data?.number}`
    } else if (params?.data?.team_id) {
      return `${params?.data?.team_id}_${params?.data?.team_name}`
    } else if (params?.data?.number) {
      return params?.data?.number
    } else {
      return ''
    }
  }

  const onDragStopGrid2 = useCallback(
    (params) => {
      setIsModified(true);
      setPreviousGrid2Data(grid2Data);
      setPreviousGrid3Data(grid3Data);

      const rowModel = grid3Api?.getModel();
      if (!rowModel) {
        return;
      }
      let renderedNodes = rowModel?.rowsToDisplay

      // let  renderedNodes = grid3Api?.getRenderedNodes();
      renderedNodes = renderedNodes.filter(node => `${node.id}` !== `${params?.nodes[0]?.id}`);

      let dropIndex = params.overNode ? params.overNode.rowIndex : renderedNodes?.length - 1;

      if (dropIndex >= renderedNodes?.length) {
        dropIndex = renderedNodes?.length - 1
      }

      const linkedNodeData = params.nodes?.map((node) => ({
        ...node.data,
        team_id: renderedNodes[dropIndex]?.data?.team_id || renderedNodes[dropIndex + 1]?.data?.team_id || null,
        team_name: renderedNodes[dropIndex]?.data?.team_name || renderedNodes[dropIndex + 1]?.data?.team_name || null,
        team_abbr: renderedNodes[dropIndex]?.data?.team_abbr || renderedNodes[dropIndex + 1]?.data?.team_abbr || null,
      }));


      // Remove the dragged row from grid2Data
      const updatedGrid2Data = grid2Data.filter((row) => row.number !== params.nodes[0].data.number);

      let insertIndex = dropIndex;

      if (renderedNodes[dropIndex]?.data?.number == null || renderedNodes[dropIndex]?.data?.number === undefined) {
        insertIndex = dropIndex + 1;
        if (renderedNodes[insertIndex]?.data?.number == null || renderedNodes[insertIndex]?.data?.number === undefined) {
          insertIndex = dropIndex + 2;
        }
      } else {
        insertIndex = renderedNodes[insertIndex]?.rowIndex + 1 ?? dropIndex + 1;
      }

      // Insert linkedNodeData into grid3Data at the insertIndex and reorder the array
      const updatedRenderedNodes = [
        ...renderedNodes
          .slice(0, insertIndex)
          .filter(node => node.data && Object.keys(node.data).length > 0) // Filter out empty or undefined data
          .map(node => node.data),
        ...(linkedNodeData || []),
        ...renderedNodes
          .slice(insertIndex)
          .filter(node => node.data && Object.keys(node.data).length > 0) // Filter out empty or undefined data
          .map(node => node.data)
      ];

      // Update grid2Data and grid3Data states
      setGrid2Data(updatedGrid2Data);
      setGrid3Data(updatedRenderedNodes);

    },
    [grid2Data, grid3Data, setGrid3Data, grid3Api]
  );

  const onDragStopGrid1 = useCallback(
    (params) => {
      setIsModified(true)
      setPreviousGrid2Data(grid2Data)
      setPreviousGrid3Data(grid3Data)
      const nodes = params.nodes
      const droppedRows = nodes
        .filter((node) => !grid3Data.some((row) => row.team_id === node?.data?.team_id))
        .map((node) => {
          node.setSelected(false)
          return node.data
        })

      setGrid3Data((prevData) => [...prevData, ...droppedRows])
    },
    [grid3Data, setGrid3Data]
  )

  useEffect(() => {
    if (!grid1Api || !grid3Api || !grid2Api) {
      return
    }

    const dropZoneParams1 = grid3Api.getRowDropZoneParams({ onDragStop: onDragStopGrid1 })
    if (!dropZoneParams1) {
      return
    }
    grid1Api.removeRowDropZone(dropZoneParams1)
    grid1Api.addRowDropZone(dropZoneParams1)

    if (grid3Data.length > 0) {
      const dropZoneParams2 = grid3Api.getRowDropZoneParams({ onDragStop: onDragStopGrid2 })
      if (!dropZoneParams2) {
        return
      }
      grid2Api.removeRowDropZone(dropZoneParams2)
      grid2Api.addRowDropZone(dropZoneParams2)
    }
    else {
      const dropZoneParams2 = grid3Api.getRowDropZoneParams({ onDragStop: onDragStopGrid2 })
      if (dropZoneParams2) {
        grid2Api.removeRowDropZone(dropZoneParams2)
      }
    }
  }, [grid1Api, grid2Api, grid3Api, onDragStopGrid1, onDragStopGrid2, grid3Data.length])

  const onSortChanged = useCallback((event) => {

    const sortedRows = grid3Api?.getModel()?.rowsToDisplay;

    const rowsWithDefinedData = sortedRows.filter(node => node.data !== undefined);
    let sortedData = rowsWithDefinedData.map(node => node.data)
    setGrid3Data(sortedData)

  }, [grid3Api]);


  const onRowDragEnd = useCallback((event) => {
    const movingNode = event?.node;
    const overNode = event?.overNode;

    if (!overNode || !movingNode.group || !overNode.group) {
      return;
    }

    // Check if we're moving over a different group
    if (movingNode.key !== overNode.key) {
      const rowModel = grid3Api?.getModel();
      if (!rowModel) {
        return;
      }

      const overNodeIndex = overNode.rowIndex;
      const movingNodeIndex = movingNode.rowIndex;

      if (overNodeIndex !== -1 && movingNodeIndex !== -1) {
        // Extract the array of rendered nodes
        const renderedNodes = rowModel?.rowsToDisplay;

        // Determine the range of rows to move
        let startIndex, endIndex;
        if (movingNodeIndex < overNodeIndex) {
          startIndex = movingNodeIndex;
          endIndex = movingNodeIndex + movingNode?.allLeafChildren?.length;
        } else {
          startIndex = overNodeIndex;
          endIndex = movingNodeIndex - 1;
        }

        // Extract the rows to move
        const rowsToMove = renderedNodes.slice(startIndex, endIndex + 1);

        // Remove the rows from their current positions
        const updatedRenderedNodes = renderedNodes.filter(node => !rowsToMove.includes(node));

        // Remove any rows with undefined data
        const filteredUpdatedRenderedNodes = updatedRenderedNodes.filter(node => node.data !== undefined);

        // Find insert index
        let teamIdCount = filteredUpdatedRenderedNodes.filter(node => Number(node.data.team_id) === Number(overNode.key));
        let firstIndexMatchingTeamId = filteredUpdatedRenderedNodes.findIndex(node => Number(node.data.team_id) === Number(overNode.key));

        if (teamIdCount.length === 0 && firstIndexMatchingTeamId === -1) {
          teamIdCount = filteredUpdatedRenderedNodes.filter(node => Number(node.data.team_id) === Number(movingNode.key));
          firstIndexMatchingTeamId = filteredUpdatedRenderedNodes.findIndex(node => Number(node.data.team_id) === Number(movingNode.key));
        }

        // Determine the index to insert the rows
        const insertIndex = firstIndexMatchingTeamId + teamIdCount.length

        // Insert the rows at the insert index
        filteredUpdatedRenderedNodes.splice(insertIndex, 0, ...rowsToMove);

        // Apply the updated order to the row model
        const rowsWithDefinedData = filteredUpdatedRenderedNodes.filter(node => node.data !== undefined);
        let sortedData = rowsWithDefinedData.map(node => node.data)
        setGrid3Data(sortedData)
        rowModel.setRowData(rowsWithDefinedData.map(node => node.data));
      }
    }
  }, [grid3Api]);

  return (
    <Modal
      {...props}
      id='kt_modal_create_app'
      size='lg'
      aria-labelledby='contained-modal-title-vcenter'
      centered
      dialogClassName='fullscreen-modal custom-dialog'
      tabIndex={-1}
      backdrop='static'
      aria-hidden='true'
      onKeyDown={(event) => { //by using onKeyDown instead of onKeyPress, we ensure function is called even if a field is in focus
        let isButtonFocused = false
        let activeElement = document.activeElement //gets the currently focussed element
        if (activeElement && activeElement.tagName === 'BUTTON') { //check if button is in focus
            isButtonFocused = true;
        }

        if (event.key === "Enter" && !isButtonFocused) { //call function only when no button is in focus
          event.stopPropagation();
          handleSaveClick();
        }
    }}
    >
      <div className='modal-header py-0 px-4'>
        <h2 className='fs-4'>
          {intl.formatMessage({ id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.TITLE' })}
        </h2>
        <div
          className='btn btn-sm btn-icon btn-active-color-dark'
          data-bs-dismiss='modal'
          aria-label='Close'
          onClick={handleCancel}
        >
          <KTSVG path='/media/icons/duotune/arrows/arr061.svg' className='svg-icon svg-icon-2x' />
        </div>
      </div>
      <div className='modal-body py-0 px-4'>
        <div className='row'>
          <div className='col-md-12'>
            <div className='d-flex align-items-center'>
              <Form.Label className='col-lg-1.5 col-form-label fw-bold fs-5 py-1' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMSETUPS.LABEL.TEAMSBASEDON">
                {intl.formatMessage({
                  id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.TEAMBASEDON',
                })}
              </Form.Label>
              <div className='col-lg-1 d-flex align-items-center w-lg-125px ps-6'>
                <input
                  className='form-check-sm me-1'
                  type='radio'
                  value='country'
                  checked={teamBasedOn === 'country'}
                  onChange={handleCheckboxChange}
                  id='basedOnCountry'
                />
                <label className='col-form-label fs-5 py-1 ignore-max-width me-5' htmlFor='basedOnCountry' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMSETUPS.LABEL.COUNTRY">
                  {' '}
                  {intl.formatMessage({ id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.COUNTRY' })}
                </label>
              </div>

              <div className='col-lg-1 d-flex align-items-center w-lg-125px ps-6'>
                <input
                  className='form-check-sm me-1'
                  type='radio'
                  value='organization'
                  checked={teamBasedOn === 'organization'}
                  onChange={handleCheckboxChange}
                  id='basedOnOrg'
                />
                <label className='col-form-label fs-5 py-1 ignore-max-width me-5' htmlFor='basedOnOrg' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMSETUPS.LABEL.ORGANIZATION">
                  {' '}
                  {intl.formatMessage({
                    id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.ORGANIZATION',
                  })}
                </label>
              </div>
            </div>
          </div>
        </div>
        {showPopup1 && (
          <div>
            {/* Popup 1 */}
            <Modal
              id='kt_modal_create_app'
              show={showPopup1}
              onHide={() => {setShowPopup1(false); setTeamName(''); setAbbreviation('')}}
              tabIndex={-1}
              backdrop='static'
              aria-hidden='true'
              dialogClassName='modal-dialog modal-dialog-centered mw-450px search-form'
              onKeyDown={(event) => { //by using onKeyDown instead of onKeyPress, we ensure function is called even if a field is in focus
                let isButtonFocused = false
                let activeElement = document.activeElement //gets the currently focussed element
                if (activeElement && activeElement.tagName === 'BUTTON') { //check if button is in focus
                    isButtonFocused = true;
                }
        
                if (event.key === "Enter" && !isButtonFocused) { //call function only when no button is in focus
                  event.stopPropagation();
                  handleOkButtonClick()
                }
            }}
            >
              <div className='modal-header py-0 px-4'>
                <h2 className='fs-4'>
                  {intl.formatMessage({ id: 'FORM.INPUT.CLASSES.TITLE.SETUPTEAMS.TEAMINFO' })}
                </h2>
                {/* begin::Close */}
                <div className='btn btn-sm btn-icon btn-active-color-dark' onClick={() => setShowPopup1(false)}>
                  <KTSVG className='svg-icon-1' path='/media/icons/duotune/arrows/arr061.svg' />
                </div>
                {/* end::Close */}
              </div>
              <div className='modal-body py-3 px-4'>
                <Form onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault() } } }>
                  <Form.Group as={Row} controlId='formTeamName' className='row mb-2'>
                    <Form.Label column className='col-lg-3 col-form-label fw-bold fs-5 py-1' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMINFO.LABEL.NAME">
                      {intl.formatMessage({ id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.NAME' })}
                    </Form.Label>
                    <Col className='col-lg-9'>
                      <Form.Control
                        className='form-control form-control-sm fs-6 min-h-20px py-1'
                        type='text'
                        placeholder='Enter team name'
                        value={teamName}
                        onChange={handleTeamNameChange}
                        isInvalid={teamNameError !== null}
                        autoFocus
                      />
                      <Form.Control.Feedback className='error_message' type='invalid'>{teamNameError}</Form.Control.Feedback>
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} controlId='formType' className='row mb-2'>
                    <Form.Label column className='col-lg-3 col-form-label fw-bold fs-5 py-1' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMINFO.LABEL.TYPE">
                      {intl.formatMessage({ id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.TYPE' })}
                    </Form.Label>
                    <Col className='col-lg-9'>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className='form-select form-select-sm fs-6 min-h-20px py-1'
                      >
                        <option value='Country'>Country</option>
                        <option value='Organization'>Organization</option>
                      </select>
                    </Col>
                  </Form.Group>

                  {selectedType === 'Country' && (
                    <Form.Group as={Row} controlId='formCountry' className='row mb-2'>
                      <Form.Label column className='col-lg-3 col-form-label fw-bold fs-5 py-1' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMINFO.LABEL.ABBREVIATION">
                        {intl.formatMessage({
                          id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.ABBREVIATION',
                        })}
                      </Form.Label>
                      <Col className='col-lg-7'>
                        <div className='d-flex align-items-center'>
                          <select
                            value={selectedCountryLabel}
                            onChange={(e) =>
                              handleCountrySelect(
                                props.form_meta.countries.find(
                                  (country) => country.label === e.target.value
                                )
                              )
                            }
                            className='form-select form-select-sm fs-6 min-h-20px py-1'
                          >
                            {props?.form_meta?.countries?.map((country, index) => (
                              <option key={index} value={country.label}>
                                {country.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedCountryError && (
                          <div className='invalid-feedback' style={{ display: 'block' }}>
                            {selectedCountryError}
                          </div>
                        )}
                      </Col>
                      <label className='col-lg-1 col-form-label fw-bold fs-5 py-1'>
                        {selectedCountry}
                      </label>
                    </Form.Group>
                  )}

                  {selectedType === 'Organization' && (
                    <>
                      <Form.Group as={Row} controlId='formAbbreviation' className='row mb-2'>
                        <Form.Label column className='col-lg-3 col-form-label fw-bold fs-5 py-1' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMINFO.LABEL.ABBREVIATION">
                          {intl.formatMessage({
                            id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.ABBREVIATION',
                          })}
                        </Form.Label>
                        <Col className='col-lg-9'>
                          <Form.Control
                            className='form-control form-control-sm fs-6 min-h-20px py-1'
                            type='text'
                            placeholder='Enter abbreviation'
                            value={abbreviation}
                            onChange={handleAbbreviationChange}
                            isInvalid={abbreviationError !== null}
                          />
                          <Form.Control.Feedback type='invalid' className='error_message'>
                            {abbreviationError}
                          </Form.Control.Feedback>
                        </Col>
                      </Form.Group>

                      <Form.Group as={Row} controlId='formCountry' className='row mb-2'>
                        <Form.Label column className='col-lg-3 col-form-label fw-bold fs-5 py-1' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMINFO.LABEL.COUNTRY">
                          {intl.formatMessage({
                            id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.COUNTRY',
                          })}
                        </Form.Label>
                        <Col className='col-lg-7'>
                          <div className='d-flex align-items-center'>
                            <select
                              value={orgCountryLabel}
                              onChange={(e) =>
                                handleOrgCountrySelect(
                                  props.form_meta.countries.find(
                                    (country) => country.label === e.target.value
                                  )
                                )
                              }
                              className='form-select form-select-sm fs-6 min-h-20px py-1'
                            >
                              {props?.form_meta?.countries?.map((country, index) => (
                                <option key={index} value={country.label}>
                                  {country.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </Col>
                        <label className='col-lg-1 col-form-label fw-bold fs-5 py-1'>
                          {orgCountry}
                        </label>
                      </Form.Group>
                    </>
                  )}
                </Form>
                <div className='card-footer d-flex justify-content-end py-3 px-0'>
                  <button
                    type='button'
                    className='btn btn-sm btn-secondary me-4 fw-bold'
                    onClick={() => {
                      setShowPopup1(false)
                      setTeamName('')
                      setAbbreviation('')
                    }}
                  >
                    {intl.formatMessage({
                      id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.CANCEL',
                    })}
                  </button>
                  <button type='button' className='btn btn-sm btn-dark fw-bold' onClick={handleOkButtonClick}>
                    {intl.formatMessage({
                      id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.OK',
                    })}
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}

        <div className='row'>
          <div className='col-md-5'>
            <div className='d-flex justify-content-between align-items-center'>
              <Form.Label className='col-form-label fs-5 py-1' style={{ marginTop: '5px' }} data-tooltip-id="CLASS.DETAIL.MODAL.TEAMSETUPS.LABEL.TEAMS">
                {intl.formatMessage({
                  id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.TEAMS',
                })}
              </Form.Label>
              <div>
                <Button
                  type='button'
                  className='btn btn-sm btn-secondary fw-bold px-1 py-0'
                  style={{ marginRight: '5px' }}
                  onClick={handlePopup1Open}
                >
                  <i className='fas fa-plus fs-7 px-1'></i>
                </Button>
                <Button
                  type='button'
                  className='btn btn-sm btn-secondary fw-bold px-1 py-0'
                  onClick={handleRemoveClick}
                >
                  <i className='fas fa-minus fs-7 px-1'></i>
                </Button>
              </div>
            </div>
            {/* <br/> */}
            <div className='ag-theme-alpine' style={{ height: '150px', width: '100%' }}>
              <AgGridReact
                rowSelection={'single'}
                // getRowId={getRowId}
                getRowId={(params) => {
                  return params.data.team_id
                }}
                defaultColDef={defaultColDef}
                rowHeight={22}
                headerHeight={30}
                rowData={grid1Data}
                columnDefs={columnDefsTeams}
                containerStyle={containerStyleTeams}
                onRowDoubleClicked={(row_data) => {
                  copyTeamsData(row_data)
                }}
                rowDragManaged={true}
                rowDragEntireRow={true}
                animateRows={true}
                rowDragMultiRow={true}
                // suppressRowClickSelection={true}
                suppressMoveWhenRowDragging={true}
                onGridReady={(params) => {
                  setGrid1Api(params.api)
                  setGrid1ApiColumns(params.columnApi)
                }}
                rowDragText={teamRowDragText}
              />
            </div>
            <br />
            <Row>
              <Col>
                <Form.Label className='col-form-label fs-5 py-1' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMSETUPS.LABEL.INDIVIDUALTRIPS">
                  {' '}
                  {intl.formatMessage({
                    id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.INDIVIDUALTRIPS',
                  })}
                </Form.Label>
              </Col>
              <Col className='text-end'>
                <Form.Label>({grid2Data ? `${grid2Data.length} ` : '0'})</Form.Label>
              </Col>
            </Row>
            <div className='ag-theme-alpine' style={{ height: '190px', width: '100%' }}>
              <AgGridReact
                key={JSON.stringify(grid3Data)}
                defaultColDef={defaultColDef}
                getRowId={(params) => {
                  return params.data.number
                }}
                rowDragManaged={true}
                rowDragEntireRow={true}
                animateRows={true}
                rowSelection={'single'}
                rowDragMultiRow={true}
                suppressMoveWhenRowDragging={true}
                rowHeight={22}
                headerHeight={30}
                rowData={grid2Data}
                columnDefs={columnDefsIndividualTrips}
                onGridReady={(params) => {
                  setGrid2Api(params.api)
                  setGrid2ApiColumns(params.columnApi)
                }}
                onRowDoubleClicked={onGridOneRowDoubleClicked}
                getRowStyle={(params) => {
                  const matchingRows = grid3Data?.filter(
                    (row) => row?.team_abbr === params?.data?.country_code
                  )
                  if (matchingRows?.length > 0) {
                    return { backgroundColor: '#E08283' }
                  } else {
                    return null // return null to use the default row style
                  }
                }}
                rowDragText={tripRowDragText}
              />
            </div>

            {grid3Data?.length > 0 && (
              <div
                style={{
                  // marginBottom: '10px',
                  color: 'black',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#D91E18',
                    width: '15px',
                    height: '8px',
                    marginRight: '5px',
                  }}
                ></div>
                <div className='col-form-label fs-6 py-1'>
                  indicates Riders who should participate in a team
                </div>
              </div>
            )}
          </div>

          <div className='col-md-7' style={{ marginTop: '20px' }}>
            <Form.Label className='col-form-label fs-5 py-1' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMSETUPS.LABEL.TEAMTRIPS">
              {intl.formatMessage({
                id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.TEAMTRIPS',
              })}
            </Form.Label>
            <div className='teams_trips_grid ag-theme-alpine' style={{ height: '350px', width: '100%' }}>
              <AgGridReact
                defaultColDef={defaultColDef}
                getRowId={getRowId}
                // rowDragManaged={true}
                suppressMoveWhenRowDragging={true}
                animateRows={true}
                rowSelection='multiple'
                rowHeight={22}
                headerHeight={30}
                rowData={grid3Data}
                columnDefs={columnDefsTeamTrips}
                groupRowRendererParams={groupRowRendererParams}
                onGridReady={(params) => setGrid3Api(params.api)}
                groupDisplayType={'groupRows'}
                groupDefaultExpanded={1}
                getRowStyle={(params) => {
                  if (params?.data?.number == null) {
                    return { backgroundColor: 'hsl(145, 70%, 95%)' }
                  }
                }}
                onRowDragEnd={onRowDragEnd}
                onSortChanged={onSortChanged}
                rowDragText={rowDragText}
              ></AgGridReact>
              <style>
                {`
                  .ag-dnd-ghost.ag-unselectable.ag-theme-alpine {
                      height: 20px !important;
                  }

                  .ag-group-expanded { pointer-events: none; display: none !important;}
              `}
              </style>
            </div>
            <div className='mt-3 d-flex align-items-center'>
              <Form.Group style={{ marginRight: '10px' }}>
                <Form.Label className='col-form-label fs-5 w-70px py-1' data-tooltip-id="CLASS.DETAIL.MODAL.TEAMSETUPS.LABEL.ENTRYNO">
                  {intl.formatMessage({
                    id: 'FORM.INPUT.CLASSES.LABEL.SETUPTEAMS.ENTRYNO',
                  })}
                </Form.Label>
              </Form.Group>
              <Form.Group controlId='formTextField' style={{ marginRight: '10px' }}>
                <Form.Control
                  className='form-control form-control-sm fs-6 min-h-20px py-1'
                  type='text'
                  value={typedValue}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group controlId='formDropdown' style={{ marginRight: '10px' }}>
                <select
                  className='form-select form-select-sm fs-6 min-h-20px py-1'
                  style={{ width: '130px', overflow: 'hidden' }}
                  value={selectedDropdownOptionId}
                  onChange={(e) => {
                    const teamId = e.target.value
                    const team = grid3Data.find((row) => row.team_id === Number(teamId))
                    if (team) {
                      setSelectedDropdownOption(team.team_name)
                      setSelectedDropdownOptionAbbr(team.team_abbr)
                      setSelectedDropdownOptionId(team.team_id)
                    }
                  }}
                >
                  <option value=''>Select Team</option>
                  {[
                    ...new Set(
                      grid3Data
                        .filter((row) => row?.team_name != null && row?.team_name != '')
                        .map((row) => row?.team_id)
                    ),
                  ].map((teamId, index) => {
                    const team = grid3Data?.find((row) => row?.team_id === teamId)
                    if (team) {
                      return (
                        <option key={teamId} value={teamId}>
                          {team?.team_name} ({team?.team_abbr})
                        </option>
                      )
                    }
                    return null // skip rendering the option if team is undefined
                  })}
                </select>
              </Form.Group>
              <Button
                type='button'
                className='fs-6 min-h-20px py-1'
                variant='secondary'
                style={{ marginRight: '10px' }}
                onClick={handleAddEntriesToTeamTrips}
                disabled={grid3Data.length === 0}
                data-tooltip-id="CLASS.DETAIL.MODAL.TEAMSETUPS.BUTTON.ADD"
              >
                {intl.formatMessage({
                  id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.TEAMS.LABEL.ADD',
                })}
              </Button>
              <Button
                type='button'
                className='fs-6 min-h-20px py-1'
                variant='secondary'
                onClick={handleRemoveRows}
                disabled={grid3Data.length === 0}
                data-tooltip-id="CLASS.DETAIL.MODAL.TEAMSETUPS.BUTTON.REMOVE"
              >
                {intl.formatMessage({
                  id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.TEAMS.LABEL.REMOVE',
                })}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* footer */}
      <div className='card-footer d-flex justify-content-end py-3 px-3'>
        <button
          type='button'
          className='btn btn-sm btn-secondary me-4 fw-bold'
          data-bs-dismiss='modal'
          onClick={handleCancel}
        >
          {intl.formatMessage({
            id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.CANCEL',
          })}
        </button>
        <button
          type='button'
          className='btn btn-sm btn-dark fw-bold'
          data-bs-dismiss='modal'
          onClick={() => {
            handleSaveClick()
            // handleCancel()
          }}
          autoFocus
        >
          {intl.formatMessage({
            id: 'FORM.INPUT.CLASSES.BUTTON.SETUPTEAMS.SAVE',
          })}
        </button>
      </div>
      {/* end footer */}
    </Modal>
  )
}

export default TeamsSetupDialog
