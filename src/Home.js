import React from 'react';
import { Navbar, Nav, NavDropdown, Form, FormControl, Button, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';

export default class Home extends React.Component {
    constructor() {
        super();
        this.top = <h2>Edgewater Christian School </h2>;
        this.middle = <h2> A Homeschool Umbrella ministry of Chesapeake Christian Fellowship​ </h2>;
    }
    state = {
        error: null,
        isLoaded: false,
        user: ""
    };

    async componentDidMount() {
        try {
            let result = await axios.get("/api/testinfo");
            this.setState({ isLoaded: true, user: result.user });
        } catch (err) {
            this.setState({
                isLoaded: true,
                err
            });
        }
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.

    }

    render() {
        const { error, isLoaded, user } = this.state;
        if (error) {
            return <div>Error: {error.message}</div>;
        } else if (!isLoaded) {
            return <div>Loading...</div>;
        } else {
            return (
                <Container>
                    <Row>
                        <Col>
                            <Navbar bg="light" expand="lg">
                                <Navbar.Brand href="#home">Edgewater Christian School</Navbar.Brand>
                                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                                <Navbar.Collapse id="basic-navbar-nav">
                                    <Nav className="mr-auto">
                                        <Nav.Link href="#home">About</Nav.Link>
                                        <Nav.Link href="#link">FAQ</Nav.Link>
                                        <NavDropdown title="Login" id="basic-nav-dropdown">
                                            <NavDropdown.Item href="#action/3.1">Existing Members</NavDropdown.Item>
                                            <NavDropdown.Divider />
                                            <NavDropdown.Item href="#action/3.4">New Registration</NavDropdown.Item>
                                            <NavDropdown.Item href="#action/3.2">Membership Info</NavDropdown.Item>
                                            <NavDropdown.Item href="#action/3.3">Legal Requirements</NavDropdown.Item>
                                        </NavDropdown>
                                    </Nav>
                                    <Form inline>
                                        <FormControl type="text" placeholder="Search" className="mr-sm-2" />
                                        <Button variant="outline-success">Search</Button>
                                    </Form>
                                </Navbar.Collapse>
                            </Navbar>
                        </Col>
                    </Row>

                    <Row>
                        <Col>Welcome {user}</Col>
                    </Row>
                    <Row>
                        <Col>A Homeschool Umbrella ministry of Chesapeake Christian Fellowship​</Col>
                    </Row>
                    <Row>
                        <Col> Our mission is to help families confidently educate their children at home by providing a supportive place to meet the portfolio review requirements in the State of Maryland.​</Col>
                    </Row>

                </Container>

            )
        }
    };


}
